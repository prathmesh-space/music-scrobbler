import axios from 'axios';

const ACR_CONFIG = {
  accessKey: (import.meta.env.VITE_ACR_ACCESS_KEY || '').trim(),
  accessSecret: (import.meta.env.VITE_ACR_ACCESS_SECRET || '').trim(),
  host: (import.meta.env.VITE_ACR_HOST || '').trim(),
  scheme: (import.meta.env.VITE_ACR_SCHEME || 'http').trim().toLowerCase(),
  proxyUrl: (import.meta.env.VITE_ACR_PROXY_URL || '').trim(),
  isDev: Boolean(import.meta.env.DEV),
};

const ACR_PATH = '/v1/identify';
const SIGNATURE_VERSION = '1';
const DATA_TYPE = 'audio';
const REQUEST_TIMEOUT_MS = 20000;
const encoder = new TextEncoder();

const hasAcrCredentials = () => Boolean(ACR_CONFIG.accessKey && ACR_CONFIG.accessSecret);
const canUseDevProxy = () => ACR_CONFIG.isDev && !ACR_CONFIG.proxyUrl && Boolean(ACR_CONFIG.host);
const normalizeHost = (host) => host.replace(/^https?:\/\//, '').replace(/\/+$/, '');

const normalizeScheme = (scheme) => (scheme === 'https' ? 'https' : 'http');

const getDirectIdentifyUrl = () => `${normalizeScheme(ACR_CONFIG.scheme)}://${normalizeHost(ACR_CONFIG.host)}${ACR_PATH}`;

const getRequestUrl = () => {
  if (ACR_CONFIG.proxyUrl) {
    if (ACR_CONFIG.proxyUrl.endsWith(ACR_PATH)) {
      return ACR_CONFIG.proxyUrl;
    }

    return `${ACR_CONFIG.proxyUrl.replace(/\/+$/, '')}${ACR_PATH}`;
  }

  if (canUseDevProxy()) {
    return `/acr-proxy${ACR_PATH}`;
  }

  return getDirectIdentifyUrl();
};

const ensureReadyToRecognize = (audioFile) => {
  if (!audioFile) {
    throw new Error('Please select an audio file to identify.');
  }

  if (typeof audioFile.size === 'number' && audioFile.size <= 0) {
    throw new Error('The selected audio file is empty. Please choose a valid recording.');
  }

  if (ACR_CONFIG.proxyUrl) {
    return;
  }

  if (!ACR_CONFIG.host || !hasAcrCredentials()) {
    throw new Error(
      'Missing ACRCloud configuration. Set VITE_ACR_PROXY_URL or all of VITE_ACR_ACCESS_KEY, VITE_ACR_ACCESS_SECRET, and VITE_ACR_HOST.'
    );
  }
};

const base64FromBuffer = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
};

const signAcrRequest = async ({ accessSecret, stringToSign }) => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API is unavailable in this browser, so ACRCloud request signing failed.');
  }

  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(accessSecret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureArrayBuffer = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign));
  return base64FromBuffer(signatureArrayBuffer);
};

const buildSignedRequestForm = async (audioFile) => {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const stringToSign = ['POST', ACR_PATH, ACR_CONFIG.accessKey, DATA_TYPE, SIGNATURE_VERSION, timestamp].join('\n');

  const signature = await signAcrRequest({
    accessSecret: ACR_CONFIG.accessSecret,
    stringToSign,
  });

  const formData = new FormData();
  formData.append('access_key', ACR_CONFIG.accessKey);
  formData.append('sample_bytes', String(audioFile.size));
  formData.append('sample', audioFile, audioFile.name || 'sample.wav');
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('data_type', DATA_TYPE);
  formData.append('signature_version', SIGNATURE_VERSION);

  return formData;
};

const buildProxyRequestBody = async (audioFile) => {
  const arrayBuffer = await audioFile.arrayBuffer();
  const mimeType = audioFile.type || 'application/octet-stream';

  return {
    body: arrayBuffer,
    headers: {
      'Content-Type': mimeType,
      'x-sample-bytes': String(audioFile.size),
      'x-sample-filename': audioFile.name || 'sample.wav',
    },
  };
};

const extractPrimaryMusicMatch = (payload) => payload?.metadata?.music?.[0] || null;

const normalizeAxiosError = (error) => {
  const apiMessage = error?.response?.data?.status?.msg;
  if (apiMessage) {
    return apiMessage;
  }

  if (error?.code === 'ECONNABORTED') {
    return 'Recognition request timed out. Try a shorter, clearer 8-15 second clip.';
  }

  if (error?.message === 'Network Error') {
    return 'Network error while contacting recognition service. In development, run `npm run dev` and use /acr-proxy, or run the local ACR proxy server and set VITE_ACR_PROXY_URL.';
  }

  return error?.message || 'Unable to identify song from audio sample.';
};

const normalizeApiPayload = (responseData) => {
  if (typeof responseData === 'string') {
    try {
      return JSON.parse(responseData);
    } catch {
      throw new Error('Recognition service returned an invalid response payload.');
    }
  }

  return responseData;
};

const recognizeSong = async (audioFile) => {
  ensureReadyToRecognize(audioFile);

  try {
    const usingProxy = Boolean(ACR_CONFIG.proxyUrl);
    const url = getRequestUrl();
    const request = usingProxy
      ? await buildProxyRequestBody(audioFile)
      : {
          body: await buildSignedRequestForm(audioFile),
          headers: {},
        };

    const response = await axios.post(url, request.body, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: request.headers,
    });

    const payload = normalizeApiPayload(response.data);

    if (payload?.status?.code !== 0) {
      throw new Error(payload?.status?.msg || 'Unable to identify song from audio sample.');
    }

    return {
      raw: payload,
      result: extractPrimaryMusicMatch(payload),
    };
  } catch (error) {
    throw new Error(normalizeAxiosError(error));
  }
};

export { recognizeSong };
