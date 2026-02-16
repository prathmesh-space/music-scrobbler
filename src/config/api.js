const normalizeBaseUrl = (url) => (url ? url.replace(/\/$/, '') : '');

export const getApiBaseUrl = () => {
  const envApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_RECOGNITION_API_URL;

  if (envApiUrl) {
    return normalizeBaseUrl(envApiUrl);
  }

  return '';
};

