import axios from 'axios';

const ACR_ACCESS_KEY = import.meta.env.VITE_ACR_ACCESS_KEY;
const ACR_ACCESS_SECRET = import.meta.env.VITE_ACR_ACCESS_SECRET;
const ACR_HOST = import.meta.env.VITE_ACR_HOST;
const ACR_PROXY_URL = import.meta.env.VITE_ACR_PROXY_URL;

const encoder = new TextEncoder();

const toBase64 = (bytes) => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const hmacSha1Base64 = async (message, secret) => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return toBase64(new Uint8Array(signature));
};

const ensureAudioFile = async (audioFile) => {
  if (!audioFile) {
    throw new Error('Please select an audio file to identify.');
  }

  const sampleBuffer = await audioFile.arrayBuffer();

  return {
    file: audioFile,
    sampleBuffer,
  };
};

const validateDirectConfig = () => {
  if (!ACR_ACCESS_KEY || !ACR_ACCESS_SECRET || !ACR_HOST) {
    throw new Error(
      'Missing ACRCloud configuration. Set VITE_ACR_PROXY_URL or all of VITE_ACR_ACCESS_KEY, VITE_ACR_ACCESS_SECRET, VITE_ACR_HOST.'
    );
  }
};

const buildIdentifyUrl = () => {
  const normalizedHost = ACR_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `https://${normalizedHost}/v1/identify`;
};

const getPrimaryResult = (data) => data?.metadata?.music?.[0] || null;

const parseAxiosError = (error) => {
  const apiMessage = error?.response?.data?.status?.msg;
  if (apiMessage) {
    return apiMessage;
  }

  if (error?.response?.status === 0 || error?.message === 'Network Error') {
    return 'Network error while contacting recognition service. If you are calling ACRCloud directly from the browser, configure a backend proxy and set VITE_ACR_PROXY_URL.';
  }

  return error?.message || 'Unable to identify song from audio sample.';
};

const recognizeSongViaProxy = async ({ file, sampleBuffer }) => {
  const formData = new FormData();
  formData.append('sample_bytes', sampleBuffer.byteLength.toString());
  formData.append('sample', file, file.name || 'sample.mp3');

  const response = await axios.post(ACR_PROXY_URL, formData);
  return response.data;
};

const recognizeSongDirect = async ({ file, sampleBuffer }) => {
  validateDirectConfig();

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const stringToSign = ['POST', '/v1/identify', ACR_ACCESS_KEY, 'audio', '1', timestamp].join('\n');
  const signature = await hmacSha1Base64(stringToSign, ACR_ACCESS_SECRET);

  const formData = new FormData();
  formData.append('access_key', ACR_ACCESS_KEY);
  formData.append('sample_bytes', sampleBuffer.byteLength.toString());
  formData.append('sample', file, file.name || 'sample.mp3');
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('data_type', 'audio');
  formData.append('signature_version', '1');

  const response = await axios.post(buildIdentifyUrl(), formData);
  return response.data;
};

const recognizeSong = async (audioFile) => {
  const audioPayload = await ensureAudioFile(audioFile);

  try {
    const payload = ACR_PROXY_URL
      ? await recognizeSongViaProxy(audioPayload)
      : await recognizeSongDirect(audioPayload);

    if (payload?.status?.code !== 0) {
      throw new Error(payload?.status?.msg || 'Unable to identify song from audio sample.');
    }

    return {
      raw: payload,
      result: getPrimaryResult(payload),
    };
  } catch (error) {
    throw new Error(parseAxiosError(error));
  }
};

export { recognizeSong };
