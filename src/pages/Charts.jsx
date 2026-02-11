import { useEffect, useMemo, useState } from 'react';
import { Loader2, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { getTopAlbums, getTopArtists, getTopTracks } from '../services/lastfm';
import {
  getSpotifyAlbumImage,
  getSpotifyArtistImage,
  getSpotifyTrackImage,
} from '../services/spotify';
import {
  buildSearchQuery,
  getSpotifySearchUrl,
  getYouTubeSearchUrl,
} from '../utils/musicLinks';
import { getLastFmImageUrl } from '../utils/lastfmImage.js';

const periods = [
  { value: '7day', label: '7 Days' },
  { value: '1month', label: '1 Month' },
  { value: '3month', label: '3 Months' },
  { value: '6month', label: '6 Months' },
  { value: '12month', label: '1 Year' },
  { value: 'overall', label: 'All Time' },
];

const extractArtistName = (item) => item.artist?.name || item.artist?.['#text'] || '';

const buildImageCacheKey = (item, type) => {
  if (type === 'artists') return `artist:${item.name}`;
  if (type === 'albums') return `album:${item.name}:${extractArtistName(item)}`;
  return `track:${item.name}:${extractArtistName(item)}`;
};

export default function Charts({ username }) {
  const [activeTab, setActiveTab] = useState('artists');
  const [timePeriod, setTimePeriod] = useState('7day');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spotifyImages, setSpotifyImages] = useState({});

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        let result;
        if (activeTab === 'artists') {
          result = await getTopArtists(username, timePeriod, 50);
          setData(result.artist || []);
        } else if (activeTab === 'albums') {
          result = await getTopAlbums(username, timePeriod, 50);
          setData(result.album || []);
        } else {
          result = await getTopTracks(username, timePeriod, 50);
          setData(result.track || []);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [activeTab, timePeriod, username]);

  useEffect(() => {
    let cancelled = false;

    const hydrateSpotifyImages = async () => {
      const missingItems = data.filter((item) => {
        const hasLastFmImage = Boolean(getLastFmImageUrl(item.image));
        const cacheKey = buildImageCacheKey(item, activeTab);
        return !hasLastFmImage && !spotifyImages[cacheKey];
      });

      if (!missingItems.length) return;

      const resolved = await Promise.all(
        missingItems.map(async (item) => {
          const artistName = extractArtistName(item);
          const cacheKey = buildImageCacheKey(item, activeTab);

          if (activeTab === 'artists') {
            return [cacheKey, await getSpotifyArtistImage(item.name || '')];
          }

          if (activeTab === 'albums') {
            return [
              cacheKey,
              await getSpotifyAlbumImage({
                albumName: item.name || '',
                artistName,
              }),
            ];
          }

          return [
            cacheKey,
            await getSpotifyTrackImage({
              trackName: item.name || '',
              artistName,
            }),
          ];
        }),
      );

      if (cancelled) return;

      setSpotifyImages((previous) => {
        const next = { ...previous };
        resolved.forEach(([cacheKey, imageUrl]) => {
          if (imageUrl) next[cacheKey] = imageUrl;
        });
        return next;
      });
    };

    if (data.length > 0) {
      hydrateSpotifyImages();
    }

    return () => {
      cancelled = true;
    };
  }, [activeTab, data, spotifyImages]);

  const rows = useMemo(
    () =>
      data.map((item, index) => {
        const artistName = extractArtistName(item);
        const query = buildSearchQuery({
          type: activeTab,
          name: item.name,
          artist: artistName,
        });

        const cacheKey = buildImageCacheKey(item, activeTab);
        const imageUrl = getLastFmImageUrl(item.image) || spotifyImages[cacheKey] || '';

        const simulatedChange = Math.random() * 10 - 5;
        const changeIcon =
          simulatedChange > 2 ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : simulatedChange < -2 ? (
            <TrendingDown className="w-4 h-4 text-red-400" />
          ) : (
            <Minus className="w-4 h-4 text-gray-400" />
          );

        return {
          key: `${item.name}-${artistName}-${index}`,
          rank: index + 1,
          item,
          artistName,
          imageUrl,
          spotifyUrl: getSpotifySearchUrl(query),
          youTubeUrl: getYouTubeSearchUrl(query),
          changeIcon,
        };
      }),
    [activeTab, data, spotifyImages],
  );

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Top Charts</h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setActiveTab('artists')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'artists'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Top Artists
          </button>
          <button
            onClick={() => setActiveTab('albums')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'albums'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Top Albums
          </button>
          <button
            onClick={() => setActiveTab('tracks')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'tracks'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Top Tracks
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => setTimePeriod(period.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                timePeriod === period.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      {activeTab === 'artists' ? 'Artist' : activeTab === 'albums' ? 'Album' : 'Track'}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Plays</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Open</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.key}
                      className="border-t border-gray-700 hover:bg-gray-700 transition"
                    >
                      <td className="px-6 py-4">
                        <span className="text-2xl font-bold text-purple-400">#{row.rank}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          {row.imageUrl ? (
                            <img src={row.imageUrl} alt={row.item.name} className="w-12 h-12 rounded object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-300">
                              {row.item.name?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-white font-semibold">{row.item.name}</p>
                            {activeTab !== 'artists' && (
                              <p className="text-gray-400 text-sm">{row.artistName || 'Unknown artist'}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-semibold">
                          {Number.parseInt(row.item.playcount, 10).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={row.youTubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                          >
                            YouTube
                          </a>
                          <a
                            href={row.spotifyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
                          >
                            Spotify
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">{row.changeIcon}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-400">No data available for this time period</div>
        )}
      </div>
    </div>
  );
}
