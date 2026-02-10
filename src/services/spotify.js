import axios from 'axios';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const TOKEN_CACHE_KEY = 'spotify_cc_token';
const IMAGE_CACHE_PREFIX = 'spotify_artist_image:';

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

const memoryImageCache = new Map();
let memoryToken = null;

const hasSpotifyCredentials = () => Boolean(clientId && clientSecret);

const getEncodedCredentials = () => btoa(`${clientId}:${clientSecret}`);

const readTokenFromStorage = () => {
  try {
    const raw = localStorage.getItem(TOKEN_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveTokenToStorage = (tokenPayload) => {
  try {
    localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(tokenPayload));
  } catch {
    // no-op if storage is unavailable
  }
};

const getSpotifyToken = async () => {
  if (!hasSpotifyCredentials()) return null;

  const now = Date.now();

  if (memoryToken?.accessToken && memoryToken.expiresAt > now + 5000) {
    return memoryToken.accessToken;
  }

  const storedToken = readTokenFromStorage();
  if (storedToken?.accessToken && storedToken.expiresAt > now + 5000) {
    memoryToken = storedToken;
    return storedToken.accessToken;
  }

  const response = await axios.post(
    SPOTIFY_TOKEN_URL,
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        Authorization: `Basic ${getEncodedCredentials()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const accessToken = response.data?.access_token;
  const expiresInSeconds = Number(response.data?.expires_in || 0);
  if (!accessToken || !expiresInSeconds) return null;

  const tokenPayload = {
    accessToken,
    expiresAt: now + expiresInSeconds * 1000,
  };

  memoryToken = tokenPayload;
  saveTokenToStorage(tokenPayload);

  return accessToken;
};

const getImageFromStorageCache = (artistName) => {
  try {
    return localStorage.getItem(`${IMAGE_CACHE_PREFIX}${artistName.toLowerCase()}`) || '';
  } catch {
    return '';
  }
};

const setImageInStorageCache = (artistName, imageUrl) => {
  try {
    localStorage.setItem(`${IMAGE_CACHE_PREFIX}${artistName.toLowerCase()}`, imageUrl || '');
  } catch {
    // no-op if storage is unavailable
  }
};

const getSpotifyArtistImage = async (artistName = '') => {
  const normalizedArtist = artistName.trim();
  if (!normalizedArtist) return '';

  if (memoryImageCache.has(normalizedArtist)) {
    return memoryImageCache.get(normalizedArtist) || '';
  }

  const storageCached = getImageFromStorageCache(normalizedArtist);
  if (storageCached) {
    memoryImageCache.set(normalizedArtist, storageCached);
    return storageCached;
  }

  const token = await getSpotifyToken();
  if (!token) {
    memoryImageCache.set(normalizedArtist, '');
    return '';
  }

  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: normalizedArtist,
        type: 'artist',
        limit: 1,
      },
    });

    const imageUrl = response.data?.artists?.items?.[0]?.images?.[0]?.url || '';
    memoryImageCache.set(normalizedArtist, imageUrl);
    setImageInStorageCache(normalizedArtist, imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Spotify image lookup failed:', error?.message || error);
    memoryImageCache.set(normalizedArtist, '');
    return '';
  }
};

export { getSpotifyArtistImage, hasSpotifyCredentials };
