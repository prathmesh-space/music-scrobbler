export const getLastFmImageUrl = (images = []) => {
  const firstAvailableImage = images.find((image) => image?.['#text']);
  return firstAvailableImage?.['#text']?.replace(/^http:\/\//, 'https://') || '';
};
