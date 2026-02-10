const LASTFM_PLACEHOLDER_HASH = '2a96cbd8b46e442fc41c2b86b821562f';

const normalizeLastFmUrl = (url = '') => url.replace(/^http:\/\//, 'https://');

const isValidLastFmImageUrl = (url = '') => {
  if (!url) return false;
  return !url.includes(LASTFM_PLACEHOLDER_HASH);
};

export const getLastFmImageUrl = (images = []) => {
  const imageCandidates = [...images]
    .reverse()
    .map((image) => normalizeLastFmUrl(image?.['#text'] || ''))
    .filter((url) => isValidLastFmImageUrl(url));

  return imageCandidates[0] || '';
};
