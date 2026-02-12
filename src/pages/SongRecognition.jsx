import { useState, useRef } from 'react';
import WaveformVisualizer from './WaveformVisualizer';
import ResultCard from './ResultCard';
import './SongRecognition.css';

// Simple audio recorder class
class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
  }

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
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
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
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
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      // Call your backend API
      const response = await fetch('/api/recognize', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setResult(data);
      setIsProcessing(false);
      
      // Call optional callback with result
      if (onResult) {
        onResult(data);
      }
    } catch (error) {
      setError('Recognition failed');
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
              <span className="btn-icon">🎤</span>
              <span className="btn-text">Start Recording</span>
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <label className="btn-secondary upload-btn">
              <span className="btn-icon">📁</span>
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
    </div>
  );
}
