import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Mic, Music2, Square, Upload } from 'lucide-react';
import { recognizeSong } from '../services/recognition';

const formatArtists = (artists = []) => artists.map((artist) => artist.name).filter(Boolean).join(', ');

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

  useEffect(() => {
    if (!recording) return undefined;

    const timer = window.setInterval(() => {
      setRecordingTime((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => () => {
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

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
      const mediaRecorder = new MediaRecorder(stream);

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const extension = mimeType.includes('mp4') ? 'm4a' : 'webm';
        const recordedBlob = new Blob(chunksRef.current, { type: mimeType });
        const recordedFile = new File([recordedBlob], `recording.${extension}`, { type: mimeType });

        setSelectedFile(recordedFile);
        setRecording(false);
        setRecordingTime(0);

        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
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
      const response = await recognizeSong(selectedFile);
      if (!response.result) {
        setError('No matching track found in ACRCloud results.');
        setResult(null);
      } else {
        setResult(response.result);
      }
    } catch (identifyError) {
      setError(identifyError.message || 'Failed to identify song.');
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
          <p className="text-gray-300">
            Upload a short audio clip and we&apos;ll identify the song with ACRCloud.
          </p>
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
