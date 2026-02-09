import axios from 'axios';

const API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const SHARED_SECRET = import.meta.env.VITE_LASTFM_SHARED_SECRET;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

const md5 = (string) => {
  const rotateLeft = (value, shift) => (value << shift) | (value >>> (32 - shift));
  const addUnsigned = (x, y) => {
    const x4 = x & 0x40000000;
    const y4 = y & 0x40000000;
    const x8 = x & 0x80000000;
    const y8 = y & 0x80000000;
    const result = (x & 0x3fffffff) + (y & 0x3fffffff);
    if (x4 & y4) {
      return result ^ 0x80000000 ^ x8 ^ y8;
    }
    if (x4 | y4) {
      return result ^ 0x40000000 ^ x8 ^ y8;
    }
    return result ^ x8 ^ y8;
  };
  const convertToWordArray = (input) => {
    const wordArray = [];
    const messageLength = input.length;
    for (let i = 0; i < messageLength - 3; i += 4) {
      const value =
        input.charCodeAt(i) |
        (input.charCodeAt(i + 1) << 8) |
        (input.charCodeAt(i + 2) << 16) |
        (input.charCodeAt(i + 3) << 24);
      wordArray.push(value);
    }
    let value = 0;
    switch (messageLength % 4) {
      case 0:
        value = 0x080000000;
        break;
      case 1:
        value = input.charCodeAt(messageLength - 1) | 0x0800000;
        break;
      case 2:
        value = input.charCodeAt(messageLength - 2) | (input.charCodeAt(messageLength - 1) << 8) | 0x08000;
        break;
      case 3:
        value =
          input.charCodeAt(messageLength - 3) |
          (input.charCodeAt(messageLength - 2) << 8) |
          (input.charCodeAt(messageLength - 1) << 16) |
          0x0800000;
        break;
      default:
        break;
    }
    wordArray.push(value);
    while ((wordArray.length % 16) !== 14) {
      wordArray.push(0);
    }
    wordArray.push(messageLength << 3);
    wordArray.push(messageLength >>> 29);
    return wordArray;
  };
  const wordToHex = (value) => {
    let hexValue = '';
    for (let i = 0; i <= 3; i += 1) {
      const byte = (value >>> (i * 8)) & 255;
      const temp = `0${byte.toString(16)}`;
      hexValue += temp.slice(-2);
    }
    return hexValue;
  };
  const utf8Encode = (input) => unescape(encodeURIComponent(input));
  const message = utf8Encode(string);
  const wordArray = convertToWordArray(message);
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;
  const S11 = 7;
  const S12 = 12;
  const S13 = 17;
  const S14 = 22;
  const S21 = 5;
  const S22 = 9;
  const S23 = 14;
  const S24 = 20;
  const S31 = 4;
  const S32 = 11;
  const S33 = 16;
  const S34 = 23;
  const S41 = 6;
  const S42 = 10;
  const S43 = 15;
  const S44 = 21;
  const F = (x, y, z) => (x & y) | (~x & z);
  const G = (x, y, z) => (x & z) | (y & ~z);
  const H = (x, y, z) => x ^ y ^ z;
  const I = (x, y, z) => y ^ (x | ~z);
  const FF = (aValue, bValue, cValue, dValue, xValue, s, ac) =>
    addUnsigned(rotateLeft(addUnsigned(addUnsigned(aValue, F(bValue, cValue, dValue)), addUnsigned(xValue, ac)), s), bValue);
  const GG = (aValue, bValue, cValue, dValue, xValue, s, ac) =>
    addUnsigned(rotateLeft(addUnsigned(addUnsigned(aValue, G(bValue, cValue, dValue)), addUnsigned(xValue, ac)), s), bValue);
  const HH = (aValue, bValue, cValue, dValue, xValue, s, ac) =>
    addUnsigned(rotateLeft(addUnsigned(addUnsigned(aValue, H(bValue, cValue, dValue)), addUnsigned(xValue, ac)), s), bValue);
  const II = (aValue, bValue, cValue, dValue, xValue, s, ac) =>
    addUnsigned(rotateLeft(addUnsigned(addUnsigned(aValue, I(bValue, cValue, dValue)), addUnsigned(xValue, ac)), s), bValue);
  for (let i = 0; i < wordArray.length; i += 16) {
    const aValue = a;
    const bValue = b;
    const cValue = c;
    const dValue = d;
    a = FF(a, b, c, d, wordArray[i], S11, 0xd76aa478);
    d = FF(d, a, b, c, wordArray[i + 1], S12, 0xe8c7b756);
    c = FF(c, d, a, b, wordArray[i + 2], S13, 0x242070db);
    b = FF(b, c, d, a, wordArray[i + 3], S14, 0xc1bdceee);
    a = FF(a, b, c, d, wordArray[i + 4], S11, 0xf57c0faf);
    d = FF(d, a, b, c, wordArray[i + 5], S12, 0x4787c62a);
    c = FF(c, d, a, b, wordArray[i + 6], S13, 0xa8304613);
    b = FF(b, c, d, a, wordArray[i + 7], S14, 0xfd469501);
    a = FF(a, b, c, d, wordArray[i + 8], S11, 0x698098d8);
    d = FF(d, a, b, c, wordArray[i + 9], S12, 0x8b44f7af);
    c = FF(c, d, a, b, wordArray[i + 10], S13, 0xffff5bb1);
    b = FF(b, c, d, a, wordArray[i + 11], S14, 0x895cd7be);
    a = FF(a, b, c, d, wordArray[i + 12], S11, 0x6b901122);
    d = FF(d, a, b, c, wordArray[i + 13], S12, 0xfd987193);
    c = FF(c, d, a, b, wordArray[i + 14], S13, 0xa679438e);
    b = FF(b, c, d, a, wordArray[i + 15], S14, 0x49b40821);
    a = GG(a, b, c, d, wordArray[i + 1], S21, 0xf61e2562);
    d = GG(d, a, b, c, wordArray[i + 6], S22, 0xc040b340);
    c = GG(c, d, a, b, wordArray[i + 11], S23, 0x265e5a51);
    b = GG(b, c, d, a, wordArray[i], S24, 0xe9b6c7aa);
    a = GG(a, b, c, d, wordArray[i + 5], S21, 0xd62f105d);
    d = GG(d, a, b, c, wordArray[i + 10], S22, 0x2441453);
    c = GG(c, d, a, b, wordArray[i + 15], S23, 0xd8a1e681);
    b = GG(b, c, d, a, wordArray[i + 4], S24, 0xe7d3fbc8);
    a = GG(a, b, c, d, wordArray[i + 9], S21, 0x21e1cde6);
    d = GG(d, a, b, c, wordArray[i + 14], S22, 0xc33707d6);
    c = GG(c, d, a, b, wordArray[i + 3], S23, 0xf4d50d87);
    b = GG(b, c, d, a, wordArray[i + 8], S24, 0x455a14ed);
    a = GG(a, b, c, d, wordArray[i + 13], S21, 0xa9e3e905);
    d = GG(d, a, b, c, wordArray[i + 2], S22, 0xfcefa3f8);
    c = GG(c, d, a, b, wordArray[i + 7], S23, 0x676f02d9);
    b = GG(b, c, d, a, wordArray[i + 12], S24, 0x8d2a4c8a);
    a = HH(a, b, c, d, wordArray[i + 5], S31, 0xfffa3942);
    d = HH(d, a, b, c, wordArray[i + 8], S32, 0x8771f681);
    c = HH(c, d, a, b, wordArray[i + 11], S33, 0x6d9d6122);
    b = HH(b, c, d, a, wordArray[i + 14], S34, 0xfde5380c);
    a = HH(a, b, c, d, wordArray[i + 1], S31, 0xa4beea44);
    d = HH(d, a, b, c, wordArray[i + 4], S32, 0x4bdecfa9);
    c = HH(c, d, a, b, wordArray[i + 7], S33, 0xf6bb4b60);
    b = HH(b, c, d, a, wordArray[i + 10], S34, 0xbebfbc70);
    a = HH(a, b, c, d, wordArray[i + 13], S31, 0x289b7ec6);
    d = HH(d, a, b, c, wordArray[i + 0], S32, 0xeaa127fa);
    c = HH(c, d, a, b, wordArray[i + 3], S33, 0xd4ef3085);
    b = HH(b, c, d, a, wordArray[i + 6], S34, 0x4881d05);
    a = HH(a, b, c, d, wordArray[i + 9], S31, 0xd9d4d039);
    d = HH(d, a, b, c, wordArray[i + 12], S32, 0xe6db99e5);
    c = HH(c, d, a, b, wordArray[i + 15], S33, 0x1fa27cf8);
    b = HH(b, c, d, a, wordArray[i + 2], S34, 0xc4ac5665);
    a = II(a, b, c, d, wordArray[i + 0], S41, 0xf4292244);
    d = II(d, a, b, c, wordArray[i + 7], S42, 0x432aff97);
    c = II(c, d, a, b, wordArray[i + 14], S43, 0xab9423a7);
    b = II(b, c, d, a, wordArray[i + 5], S44, 0xfc93a039);
    a = II(a, b, c, d, wordArray[i + 12], S41, 0x655b59c3);
    d = II(d, a, b, c, wordArray[i + 3], S42, 0x8f0ccc92);
    c = II(c, d, a, b, wordArray[i + 10], S43, 0xffeff47d);
    b = II(b, c, d, a, wordArray[i + 1], S44, 0x85845dd1);
    a = II(a, b, c, d, wordArray[i + 8], S41, 0x6fa87e4f);
    d = II(d, a, b, c, wordArray[i + 15], S42, 0xfe2ce6e0);
    c = II(c, d, a, b, wordArray[i + 6], S43, 0xa3014314);
    b = II(b, c, d, a, wordArray[i + 13], S44, 0x4e0811a1);
    a = II(a, b, c, d, wordArray[i + 4], S41, 0xf7537e82);
    d = II(d, a, b, c, wordArray[i + 11], S42, 0xbd3af235);
    c = II(c, d, a, b, wordArray[i + 2], S43, 0x2ad7d2bb);
    b = II(b, c, d, a, wordArray[i + 9], S44, 0xeb86d391);
    a = addUnsigned(a, aValue);
    b = addUnsigned(b, bValue);
    c = addUnsigned(c, cValue);
    d = addUnsigned(d, dValue);
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
};

const createApiSignature = (params) => {
  if (!SHARED_SECRET) {
    throw new Error('Last.fm shared secret missing');
  }
  const signatureBase = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join('');
  return md5(`${signatureBase}${SHARED_SECRET}`);
};

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
const getAuthUrl = () => {
  const callbackUrl = `${window.location.origin}/callback`;
  return `https://www.last.fm/api/auth/?api_key=${API_KEY}&cb=${callbackUrl}`;
};

// Get session token after OAuth callback
const getSession = async (token) => {
  const signedParams = {
    method: 'auth.getSession',
    token: token,
    api_key: API_KEY,
  };
  const api_sig = createApiSignature(signedParams);
  const data = await apiRequest({
    ...signedParams,
    api_sig,
  });
  
  if (data.session) {
    saveSessionToken(data.session.key);
    saveUsername(data.session.name);
    return data.session;
  }
  throw new Error('Failed to get session');
};

// Get user info
const getUserInfo = async (username) => {
  const data = await apiRequest({
    method: 'user.getInfo',
    user: username || getUsername(),
  });
  return data.user;
};

// Get recent tracks
const getRecentTracks = async (username, limit = 50, page = 1) => {
  const data = await apiRequest({
    method: 'user.getRecentTracks',
    user: username || getUsername(),
    limit: limit,
    page: page,
  });
   return data.recenttracks;
};


// Get track info
const getTrackInfo = async (artist, track, username) => {
  const data = await apiRequest({
    method: 'track.getInfo',
    artist: artist,
    track: track,
    username: username || getUsername(),
  });
  return data.track;
};


// Search tracks
const searchTracks = async (query, limit = 30) => {
  const data = await apiRequest({
    method: 'track.search',
    track: query,
    limit: limit,
  });
  return data.results;
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!getSessionToken();
};

// Logout
  const logout = () => {
  clearSessionToken();
  localStorage.removeItem('lastfm_username');
  localStorage.clear(); // Clear all cache
};

// Export utilities
export {
  getSessionToken,
  getUsername,
  getAuthUrl,
  getSession,
  getUserInfo,
  getRecentTracks,
  getTrackInfo,
  searchTracks,
  isAuthenticated,
  logout,
};
