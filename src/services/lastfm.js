import axios from 'axios';

const API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const SHARED_SECRET = import.meta.env.VITE_LASTFM_SHARED_SECRET;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

// Get session token from localStorage
const getSessionToken = () => {
  return localStorage.getItem('lastfm_session_token');
};

// Save session token to localStorage
const saveSessionToken = (token) => {
  localStorage.setItem('lastfm_session_token', token);
};

// Clear session token
const clearSessionToken = () => {
  localStorage.removeItem('lastfm_session_token');
};

// Get authenticated username
const getUsername = () => {
  return localStorage.getItem('lastfm_username');
};

// Save username
const saveUsername = (username) => {
  localStorage.setItem('lastfm_username', username);
};

// Generic API request
const apiRequest = async (params) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        api_key: API_KEY,
        format: 'json',
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Last.fm API Error:', error);
    throw error;
  }
};

// Get authorization URL for OAuth
export const getAuthUrl = () => {
  const callbackUrl = `${window.location.origin}/callback`;
  return `http://www.last.fm/api/auth/?api_key=${API_KEY}&cb=${callbackUrl}`;
};

// Get session token after OAuth callback
export const getSession = async (token) => {
  const data = await apiRequest({
    method: 'auth.getSession',
    token: token,
  });
  
  if (data.session) {
    saveSessionToken(data.session.key);
    saveUsername(data.session.name);
    return data.session;
  }
  throw new Error('Failed to get session');
};

// Get user info
export const getUserInfo = async (username) => {
  const data = await apiRequest({
    method: 'user.getInfo',
    user: username || getUsername(),
  });
  return data.user;
};

// Get recent tracks
export const getRecentTracks = async (username, limit = 50, page = 1) => {
  const data = await apiRequest({
    method: 'user.getRecentTracks',
    user: username || getUsername(),
    limit: limit,
    page: page,
    extended: 1,
  });
  return data.recenttracks;
};

// Get top artists
export const getTopArtists = async (username, period = 'overall', limit = 50) => {
  const data = await apiRequest({
    method: 'user.getTopArtists',
    user: username || getUsername(),
    period: period, // overall | 7day | 1month | 3month | 6month | 12month
    limit: limit,
  });
  return data.topartists;
};

// Get top albums
export const getTopAlbums = async (username, period = 'overall', limit = 50) => {
  const data = await apiRequest({
    method: 'user.getTopAlbums',
    user: username || getUsername(),
    period: period,
    limit: limit,
  });
  return data.topalbums;
};

// Get top tracks
export const getTopTracks = async (username, period = 'overall', limit = 50) => {
  const data = await apiRequest({
    method: 'user.getTopTracks',
    user: username || getUsername(),
    period: period,
    limit: limit,
  });
  return data.toptracks;
};

// Get artist info
export const getArtistInfo = async (artist) => {
  const data = await apiRequest({
    method: 'artist.getInfo',
    artist: artist,
  });
  return data.artist;
};

// Get album info
export const getAlbumInfo = async (artist, album) => {
  const data = await apiRequest({
    method: 'album.getInfo',
    artist: artist,
    album: album,
  });
  return data.album;
};

// Get track info
export const getTrackInfo = async (artist, track, username) => {
  const data = await apiRequest({
    method: 'track.getInfo',
    artist: artist,
    track: track,
    username: username || getUsername(),
  });
  return data.track;
};

// Search tracks
export const searchTracks = async (query, limit = 30) => {
  const data = await apiRequest({
    method: 'track.search',
    track: query,
    limit: limit,
  });
  return data.results;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getSessionToken();
};

// Logout
export const logout = () => {
  clearSessionToken();
  localStorage.removeItem('lastfm_username');
  localStorage.clear(); // Clear all cache
};

// Export utilities
export { getSessionToken, getUsername };