import { useState, useRef } from 'react';
import WaveformVisualizer from '../components/Recognition/WaveformVisualizer';
import ResultCard from '../components/Recognition/ResultCard';
import { recognizeSong as identifySong } from '../services/recognition';
import '../components/Recognition/SongRecognition.css';

// Simple audio recorder class
class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.mimeType = 'audio/webm';
  }

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ].find((type) => MediaRecorder.isTypeSupported(type));

      this.mediaRecorder = preferredMimeType
        ? new MediaRecorder(this.stream, { mimeType: preferredMimeType })
        : new MediaRecorder(this.stream);

      this.mimeType = this.mediaRecorder.mimeType || preferredMimeType || this.mimeType;
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Microphone access denied');
    }
  }

  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: this.mimeType || 'audio/webm' });
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

export default function SongRecognition({ onResult }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [analyzerData, setAnalyzerData] = useState(null);
  
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);

  const startRecording = async () => {
    try {
      setError(null);
      setResult(null);
      
      recorderRef.current = new AudioRecorder();
      await recorderRef.current.startRecording();
      
      // Setup audio analysis for visualization
      const stream = recorderRef.current.stream;
      audioContextRef.current = new AudioContext();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      analyzerRef.current.fftSize = 256;
      
      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAnalyzer = () => {
        if (analyzerRef.current) {
          analyzerRef.current.getByteFrequencyData(dataArray);
          setAnalyzerData([...dataArray]);
          requestAnimationFrame(updateAnalyzer);
        }
      };
      updateAnalyzer();
      
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      setError(err.message);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      clearInterval(timerRef.current);
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyzerRef.current = null;
      setAnalyzerData(null);
      
      const audioBlob = await recorderRef.current.stopRecording();
      setIsProcessing(true);
      
      await recognizeSong(audioBlob);
      
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const recognizeSong = async (audioBlob) => {
    try {
      const extensionByMimeType = {
        'audio/webm;codecs=opus': 'webm',
        'audio/webm': 'webm',
        'audio/mp4': 'mp4',
      };
      const mimeType = audioBlob.type || 'audio/webm';
      const extension = extensionByMimeType[mimeType] || 'webm';

      const audioFile = new File([audioBlob], `recording.${extension}`, {
        type: mimeType,
      });
      const data = await identifySong(audioFile);
      setResult(data.result || data.raw || null);
      setIsProcessing(false);
      
      // Call optional callback with result
      if (onResult) {
        onResult(data);
      }
    } catch (recognitionError) {
      setError(recognitionError.message || 'Recognition failed');
      setIsProcessing(false);
    }
  };

  const uploadFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setError(null);
    setResult(null);
    setIsProcessing(true);
    
    await recognizeSong(file);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="song-recognition">
      <div className="visualizer-section">
        <WaveformVisualizer 
          isRecording={isRecording} 
          analyzerData={analyzerData}
        />
        {isRecording && (
          <div className="recording-indicator">
            <span className="pulse"></span>
            <span className="time">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      <div className="controls">
        {!isRecording && !isProcessing && (
          <>
            <button 
              className="btn-primary record-btn"
              onClick={startRecording}
            >
              <span className="btn-icon"></span>
              <span className="btn-text">Start Recording</span>
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <label className="btn-secondary upload-btn">
              <span className="btn-icon"></span>
              <span className="btn-text">Upload Audio File</span>
              <input 
                type="file" 
                accept="audio/*"
                onChange={uploadFile}
                style={{ display: 'none' }}
              />
            </label>
          </>
        )}

        {isRecording && (
          <button 
            className="btn-danger stop-btn"
            onClick={stopRecording}
          >
            <span className="btn-icon">⏹</span>
            <span className="btn-text">Stop & Identify</span>
          </button>
        )}

        {isProcessing && (
          <div className="processing">
            <div className="spinner"></div>
            <p>Analyzing audio signature...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠</span>
          {error}
        </div>
      )}

      {result && (
        <div className="result-section">
          <ResultCard result={result} />
        </div>
      )}

      {/* Themed Styles - NO BLUR/TRANSPARENCY */}
      <style jsx>{`
        .song-recognition {
          background: transparent;
          color: #3E3D1A;
        }

        .btn-primary {
          background: linear-gradient(135deg, #6B5A2A 0%, #55491A 100%);
          color: #CFD0B9;
          border: none;
          border-radius: 59px;
          box-shadow: 0 4px 12px rgba(85, 73, 34, 0.3);
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #7A6833 0%, #6B5A2A 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(85, 73, 34, 0.4);
        }

        .btn-secondary {
          background: #FFFFFF;
          color: #3E3D1A;
          border: 2px solid #CFD0B9;
          border-radius: 59px;
        }

        .btn-secondary:hover {
          background: #EECEA4;
          border-color: #EECEA4;
          transform: translateY(-2px);
        }

        .btn-danger {
          background: linear-gradient(135deg, #EECEA4 0%, #FFE5D9 100%);
          color: #3E3D1A;
          border: none;
          border-radius: 59px;
          box-shadow: 0 4px 12px rgba(238, 206, 164, 0.3);
        }

        .btn-danger:hover {
          background: linear-gradient(135deg, #FFE5D9 0%, #EECEA4 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(238, 206, 164, 0.4);
        }

        .recording-indicator {
          background: #FFFFFF;
          border: 2px solid #CFD0B9;
          border-radius: 25px;
          color: #3E3D1A;
        }

        .pulse {
          background: #EECEA4;
          animation: pulse-animation 1.5s ease-out infinite;
        }

        @keyframes pulse-animation {
          0% {
            box-shadow: 0 0 0 0 rgba(238, 206, 164, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(238, 206, 164, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(238, 206, 164, 0);
          }
        }

        .processing {
          color: #3E3D1A;
        }

        .spinner {
          border: 3px solid #CFD0B9;
          border-top-color: #6B5A2A;
        }

        .error-message {
          background: #FFE5D9;
          border: 2px solid #EECEA4;
          border-radius: 20px;
          color: #3E3D1A;
        }

        .divider span {
          color: #6B5A2A;
          background: transparent;
        }

        .divider::before,
        .divider::after {
          background: #CFD0B9;
        }
      `}</style>
    </div>
  );
}