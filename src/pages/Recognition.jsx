import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Mic, Music2, Square, Upload } from 'lucide-react';
import { recognizeSong } from '../services/recognition';

const MIN_RECORDING_SECONDS = 6;

const formatArtists = (artists = []) => artists.map((artist) => artist.name).filter(Boolean).join(', ');

const getRecorderMimeType = () => {
  const preferredMimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return preferredMimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || '';
};

const floatTo16BitPCM = (view, offset, input) => {
  let position = offset;
  for (let i = 0; i < input.length; i += 1, position += 2) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(position, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
};

const interleaveChannels = (buffer) => {
  if (buffer.numberOfChannels === 1) {
    return buffer.getChannelData(0);
  }

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const interleaved = new Float32Array(left.length + right.length);

  for (let i = 0, index = 0; i < left.length; i += 1) {
    interleaved[index] = left[i];
    interleaved[index + 1] = right[i];
    index += 2;
  }

  return interleaved;
};

const audioBufferToWavBlob = (buffer) => {
  const channelData = interleaveChannels(buffer);
  const bytesPerSample = 2;
  const blockAlign = buffer.numberOfChannels * bytesPerSample;
  const byteRate = buffer.sampleRate * blockAlign;
  const dataLength = channelData.length * bytesPerSample;
  const wavBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(wavBuffer);

  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);
  floatTo16BitPCM(view, 44, channelData);

  return new Blob([wavBuffer], { type: 'audio/wav' });
};

const convertBlobToWavFile = async (blob) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const decodedAudio = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const wavBlob = audioBufferToWavBlob(decodedAudio);
    return new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
  } finally {
    await audioContext.close();
  }
};


const normalizeAudioForRecognition = async (file) => {
  try {
    return await convertBlobToWavFile(file);
  } catch {
    return file;
  }
};

const Recognition = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (!recording) return undefined;

    const timer = window.setInterval(() => {
      setRecordingTime((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(
    () => () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  const fileInfo = useMemo(() => {
    if (!selectedFile) return null;
    const kb = selectedFile.size / 1024;
    return `${selectedFile.name} (${kb.toFixed(1)} KB)`;
  }, [selectedFile]);

  const onFileChange = (event) => {
    setSelectedFile(event.target.files?.[0] || null);
    setError('');
    setResult(null);
  };

  const onStartRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Your browser does not support audio recording.');
      return;
    }

    setError('');
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getRecorderMimeType();
      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const elapsedSeconds = (Date.now() - startedAtRef.current) / 1000;
        const recordedBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });

        setRecording(false);
        setRecordingTime(0);

        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        if (recordedBlob.size === 0) {
          setError('Recording was empty. Please try again.');
          return;
        }

        if (elapsedSeconds < MIN_RECORDING_SECONDS) {
          setError(`Record at least ${MIN_RECORDING_SECONDS} seconds so fingerprint can be generated.`);
          return;
        }

        try {
          const wavFile = await convertBlobToWavFile(recordedBlob);
          setSelectedFile(wavFile);
        } catch {
          const fallbackFile = new File([recordedBlob], 'recording.webm', { type: recordedBlob.type || 'audio/webm' });
          setSelectedFile(fallbackFile);
          setError('Saved recording in browser format. If recognition fails, upload a standard audio file (mp3/wav/m4a) or record a longer clip.')
        }
      };

      mediaRecorder.start();
      setRecordingTime(0);
      setRecording(true);
    } catch (recordError) {
      setError(recordError.message || 'Microphone permission is required to record audio.');
    }
  };

  const onStopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const onIdentify = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Choose an audio clip before trying recognition.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const preparedFile = await normalizeAudioForRecognition(selectedFile);
      if (preparedFile !== selectedFile) {
        setSelectedFile(preparedFile);
      }

      const response = await recognizeSong(preparedFile);
      if (!response.result) {
        setError('No matching track found in ACRCloud results.');
        setResult(null);
      } else {
        setResult(response.result);
      }
    } catch (identifyError) {
      const message = identifyError.message || 'Failed to identify song.';
      if (message.toLowerCase().includes('fingerprint')) {
        setError('Could not generate fingerprint. Try a cleaner 8-15 second clip, avoid silence at the start, and keep music volume clearly audible.')
      } else {
        setError(message);
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 rounded-xl border border-gray-700 bg-gray-800 p-6">
          <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-white">
            <Music2 className="h-7 w-7 text-purple-400" />
            Song recognition
          </h1>
          <p className="text-gray-300">Upload or record a clear 8-15 second audio clip and we&apos;ll identify the song with ACRCloud.</p>
        </div>

        <form onSubmit={onIdentify} className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <label className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-300" htmlFor="audio-file">
            Audio sample
          </label>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              id="audio-file"
              type="file"
              accept="audio/*"
              onChange={onFileChange}
              className="block w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-200 file:mr-3 file:rounded-md file:border-0 file:bg-purple-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-500"
            />

            <button
              type="submit"
              disabled={loading || recording}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {loading ? 'Recognizing…' : 'Identify song'}
            </button>

            {recording ? (
              <button
                type="button"
                onClick={onStopRecording}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-500"
              >
                <Square className="h-4 w-4" />
                Stop recording ({recordingTime}s)
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartRecording}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2 font-medium text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Mic className="h-4 w-4" />
                Record audio
              </button>
            )}
          </div>

          {fileInfo && <p className="text-sm text-gray-400">Selected: {fileInfo}</p>}

          <p className="mt-2 text-xs text-gray-500">Tip: recognition works best with music-only clips, no talking, and at least {MIN_RECORDING_SECONDS} seconds.</p>

          {error && <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        </form>

        {result && (
          <div className="mt-6 rounded-xl border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Match found</h2>
            <div className="space-y-2 text-gray-300">
              <p>
                <span className="font-semibold text-white">Track:</span> {result.title}
              </p>
              <p>
                <span className="font-semibold text-white">Artist:</span> {formatArtists(result.artists)}
              </p>
              {result.album?.name && (
                <p>
                  <span className="font-semibold text-white">Album:</span> {result.album.name}
                </p>
              )}
              {typeof result.score !== 'undefined' && (
                <p>
                  <span className="font-semibold text-white">Confidence score:</span> {result.score}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recognition;
