import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { getTopAlbums, getTopArtists, getTopTracks } from '../services/lastfm';
import { getSpotifyAlbumImage, getSpotifyArtistImage, getSpotifyTrackImage } from '../services/spotify';
import { buildSearchQuery, getSpotifySearchUrl, getYouTubeSearchUrl } from '../utils/musicLinks';
import { getLastFmImageUrl } from '../utils/lastfmImage.js';
import { getCachedData, setCachedData } from '../utils/cache';

const PERIODS = [
  { value: '7day', label: '7 Days' },
  { value: '1month', label: '1 Month' },
  { value: '3month', label: '3 Months' },
  { value: '6month', label: '6 Months' },
  { value: '12month', label: '1 Year' },
  { value: 'overall', label: 'All Time' },
];

const TABS = ['artists', 'albums', 'tracks'];

const getEntityKey = (tab) => {
  if (tab === 'artists') return 'artist';
  if (tab === 'albums') return 'album';
  return 'track';
};

const extractArtistName = (item) => item.artist?.name || item.artist?.['#text'] || '';

const getImageCacheKey = (item, type) => {
  if (type === 'artists') return `artist:${item.name || ''}`;
  return `${type}:${item.name || ''}:${extractArtistName(item)}`;
};

export default function Charts({
  username,
  initialTab = 'artists',
  lockTab = false,
  title = 'Top Charts',
  subtitle = 'Discover your most played music',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [timePeriod, setTimePeriod] = useState('7day');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spotifyImages, setSpotifyImages] = useState({});

  useEffect(() => {
    if (TABS.includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const onRange = (event) => {
      const delta = Number(event.detail || 0);
      const index = PERIODS.findIndex((period) => period.value === timePeriod);
      const next = Math.max(0, Math.min(PERIODS.length - 1, index + delta));
      setTimePeriod(PERIODS[next].value);
    };

    window.addEventListener('music-scrobbler:range', onRange);
    return () => {
      window.removeEventListener('music-scrobbler:range', onRange);
    };
  }, [timePeriod]);

  useEffect(() => {
    let ignore = false;

    const fetchCharts = async () => {
      setLoading(true);
      const cacheKey = `charts:${username}:${activeTab}:${timePeriod}`;

      try {
        let result;
        if (activeTab === 'artists') {
          result = await getTopArtists(username, timePeriod, 50);
        } else if (activeTab === 'albums') {
          result = await getTopAlbums(username, timePeriod, 50);
        } else {
          result = await getTopTracks(username, timePeriod, 50);
        }

        const entityKey = getEntityKey(activeTab);
        const nextData = result?.[entityKey] || [];

        if (!ignore) {
          setChartData(nextData);
          setCachedData(cacheKey, nextData);
        }
      } catch {
        if (!ignore) {
          const fallback = getCachedData(cacheKey);
          setChartData(Array.isArray(fallback) ? fallback : []);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchCharts();

    return () => {
      ignore = true;
    };
  }, [activeTab, timePeriod, username]);

  useEffect(() => {
    let cancelled = false;

    const hydrateSpotifyImages = async () => {
      const missingItems = chartData.filter((item) => {
        const hasLastFmImage = Boolean(getLastFmImageUrl(item.image));
        const cacheKey = getImageCacheKey(item, activeTab);
        return !hasLastFmImage && !spotifyImages[cacheKey];
      });

      if (!missingItems.length) return;

      const nextEntries = await Promise.all(
        missingItems.map(async (item) => {
          const artistName = extractArtistName(item);
          const cacheKey = getImageCacheKey(item, activeTab);

          if (activeTab === 'artists') {
            return [cacheKey, await getSpotifyArtistImage(item.name || '')];
          }

          if (activeTab === 'albums') {
            return [
              cacheKey,
              await getSpotifyAlbumImage({ albumName: item.name || '', artistName }),
            ];
          }

          return [
            cacheKey,
            await getSpotifyTrackImage({ trackName: item.name || '', artistName }),
          ];
        }),
      );

      if (cancelled) return;

      setSpotifyImages((previous) => {
        const merged = { ...previous };
        nextEntries.forEach(([key, imageUrl]) => {
          if (imageUrl) merged[key] = imageUrl;
        });
        return merged;
      });
    };

    if (chartData.length) {
      hydrateSpotifyImages();
    }

    return () => {
      cancelled = true;
    };
  }, [activeTab, chartData, spotifyImages]);

  const rows = useMemo(
    () =>
      chartData.map((item, index) => {
        const artistName = extractArtistName(item);
        const query = buildSearchQuery({ type: activeTab, name: item.name, artist: artistName });
        const cacheKey = getImageCacheKey(item, activeTab);

        return {
          key: `${activeTab}-${item.name || 'unknown'}-${artistName}-${index}`,
          rank: index + 1,
          name: item.name || 'Unknown',
          artistName,
          plays: Number(item.playcount || 0),
          imageUrl: getLastFmImageUrl(item.image) || spotifyImages[cacheKey] || '',
          spotifyUrl: getSpotifySearchUrl(query),
          youTubeUrl: getYouTubeSearchUrl(query),
        };
      }),
    [activeTab, chartData, spotifyImages],
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-8">
      <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-black md:text-6xl">{title}</h1>
          <p className="mt-2 text-sm text-gray-600 md:text-base">{subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!lockTab &&
            TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition md:text-base ${
                  activeTab === tab
                    ? 'bg-black text-white'
                    : 'bg-white text-black ring-1 ring-gray-300 hover:bg-gray-50'
                }`}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
        </div>
      </header>

      <div className="mb-6 flex items-center justify-between">
        <label className="text-sm text-gray-600" htmlFor="chart-period">
          Time period
        </label>
        <select
          id="chart-period"
          value={timePeriod}
          onChange={(event) => setTimePeriod(event.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
        >
          {PERIODS.map((period) => (
            <option key={period.value} value={period.value}>
              {period.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-20 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading your charts…</span>
        </div>
      ) : rows.length === 0 ? (
        <p className="py-20 text-sm text-gray-600">No chart data available for this range yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rows.map((row) => (
            <article
              key={row.key}
              className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-8 text-center text-sm font-semibold text-gray-500">#{row.rank}</span>

                {row.imageUrl ? (
                  <img
                    src={row.imageUrl}
                    alt={row.name}
                    className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gray-200" />
                )}

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-black">{row.name}</h3>
                  <p className="truncate text-xs text-gray-500">
                    {activeTab === 'artists' ? `${row.plays.toLocaleString()} plays` : `${row.artistName} • ${row.plays.toLocaleString()} plays`}
                  </p>
                </div>
              </div>

              <div className="ml-3 flex items-center gap-2 text-xs">
                <a
                  href={row.youTubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-rose-700 hover:bg-rose-100"
                >
                  YouTube <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={row.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 hover:bg-emerald-100"
                >
                  Spotify <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
