import axios from 'axios';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const TOKEN_CACHE_KEY = 'spotify_cc_token';
const IMAGE_CACHE_PREFIX = 'spotify_image:';

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
    },
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

const getImageFromStorageCache = (cacheKey) => {
  try {
    return localStorage.getItem(`${IMAGE_CACHE_PREFIX}${cacheKey}`) || '';
  } catch {
    return '';
  }
};

const setImageInStorageCache = (cacheKey, imageUrl) => {
  try {
    localStorage.setItem(`${IMAGE_CACHE_PREFIX}${cacheKey}`, imageUrl || '');
  } catch {
    // no-op if storage is unavailable
  }
};

const getSpotifySearchImage = async ({ query = '', type = 'artist' }) => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return '';

  const normalizedType = type === 'album' || type === 'track' ? type : 'artist';
  const cacheKey = `${normalizedType}:${normalizedQuery.toLowerCase()}`;

  if (memoryImageCache.has(cacheKey)) {
    return memoryImageCache.get(cacheKey) || '';
  }

  const storageCached = getImageFromStorageCache(cacheKey);
  if (storageCached) {
    memoryImageCache.set(cacheKey, storageCached);
    return storageCached;
  }

  const token = await getSpotifyToken();
  if (!token) {
    memoryImageCache.set(cacheKey, '');
    return '';
  }

  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: normalizedQuery,
        type: normalizedType,
        limit: 1,
      },
    });

    let imageUrl = '';

    if (normalizedType === 'artist') {
      imageUrl = response.data?.artists?.items?.[0]?.images?.[0]?.url || '';
    } else if (normalizedType === 'album') {
      imageUrl = response.data?.albums?.items?.[0]?.images?.[0]?.url || '';
    } else {
      imageUrl = response.data?.tracks?.items?.[0]?.album?.images?.[0]?.url || '';
    }

    memoryImageCache.set(cacheKey, imageUrl);
    setImageInStorageCache(cacheKey, imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Spotify image lookup failed:', error?.message || error);
    memoryImageCache.set(cacheKey, '');
    return '';
  }
};

const getSpotifyArtistImage = async (artistName = '') =>
  getSpotifySearchImage({ query: artistName, type: 'artist' });

const getSpotifyAlbumImage = async ({ albumName = '', artistName = '' }) => {
  const query = [albumName.trim(), artistName.trim()].filter(Boolean).join(' ');
  return getSpotifySearchImage({ query, type: 'album' });
};

const getSpotifyTrackImage = async ({ trackName = '', artistName = '' }) => {
  const query = [trackName.trim(), artistName.trim()].filter(Boolean).join(' ');
  return getSpotifySearchImage({ query, type: 'track' });
};

export {
  getSpotifyArtistImage,
  getSpotifyAlbumImage,
  getSpotifyTrackImage,
  getSpotifySearchImage,
  hasSpotifyCredentials,
};
