const buildSearchQuery = ({ type, name, artist, album }) => {
  if (!name) {
    return '';
  }

  if (type === 'artists') {
    return name;
  }

  if (type === 'albums') {
    return [name, artist].filter(Boolean).join(' ');
  }

  if (type === 'tracks') {
    return [name, artist, album].filter(Boolean).join(' ');
  }

  return name;
};

const getYouTubeSearchUrl = (query) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

const getSpotifySearchUrl = (query) =>
  `https://open.spotify.com/search/${encodeURIComponent(query)}`;

export { buildSearchQuery, getYouTubeSearchUrl, getSpotifySearchUrl };
