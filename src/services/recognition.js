import axios from 'axios';

const ACR_ACCESS_KEY = import.meta.env.VITE_ACR_ACCESS_KEY;
const ACR_ACCESS_SECRET = import.meta.env.VITE_ACR_ACCESS_SECRET;
const ACR_HOST = import.meta.env.VITE_ACR_HOST;

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

const validateConfig = () => {
  if (!ACR_ACCESS_KEY || !ACR_ACCESS_SECRET || !ACR_HOST) {
    throw new Error(
      'Missing ACRCloud configuration. Set VITE_ACR_ACCESS_KEY, VITE_ACR_ACCESS_SECRET and VITE_ACR_HOST.'
    );
  }
};

const buildIdentifyUrl = () => {
  const normalizedHost = ACR_HOST.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `https://${normalizedHost}/v1/identify`;
};

const getPrimaryResult = (data) => data?.metadata?.music?.[0] || null;

const recognizeSong = async (audioFile) => {
  validateConfig();

  if (!audioFile) {
    throw new Error('Please select an audio file to identify.');
  }

  const sampleBuffer = await audioFile.arrayBuffer();
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const stringToSign = ['POST', '/v1/identify', ACR_ACCESS_KEY, 'audio', '1', timestamp].join('\n');
  const signature = await hmacSha1Base64(stringToSign, ACR_ACCESS_SECRET);

  const formData = new FormData();
  formData.append('access_key', ACR_ACCESS_KEY);
  formData.append('sample_bytes', sampleBuffer.byteLength.toString());
  formData.append('sample', new Blob([sampleBuffer]), audioFile.name || 'sample.mp3');
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('data_type', 'audio');
  formData.append('signature_version', '1');

  const response = await axios.post(buildIdentifyUrl(), formData);
  const payload = response.data;

  if (payload?.status?.code !== 0) {
    throw new Error(payload?.status?.msg || 'Unable to identify song from audio sample.');
  }

  return {
    raw: payload,
    result: getPrimaryResult(payload),
  };
};

export { recognizeSong };
