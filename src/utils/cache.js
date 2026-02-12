const CACHE_PREFIX = 'music-scrobbler-cache:';

export const setCachedData = (key, value) => {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({
        savedAt: Date.now(),
        value,
      }),
    );
  } catch (error) {
    console.warn('Unable to store cache entry', key, error);
  }
};

export const getCachedData = (key, maxAgeMs = Infinity) => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    if (Date.now() - Number(parsed.savedAt || 0) > maxAgeMs) {
      return null;
    }

    return parsed.value ?? null;
  } catch {
    return null;
  }
};
