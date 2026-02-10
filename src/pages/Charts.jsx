import { useState, useEffect } from 'react';
import { getTopArtists, getTopAlbums, getTopTracks } from '../services/lastfm';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import {
  buildSearchQuery,
  getSpotifySearchUrl,
  getYouTubeSearchUrl,
} from '../utils/musicLinks';
import { getLastFmImageUrl } from '../utils/lastfmImage.js';
import { getSpotifyArtistImage } from '../services/spotify';


export default function Charts({ username }) {
 const [activeTab, setActiveTab] = useState('artists'); // artists, albums, tracks
  const [timePeriod, setTimePeriod] = useState('7day');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [spotifyArtistImages, setSpotifyArtistImages] = useState({});

  const periods = [
    { value: '7day', label: '7 Days' },
    { value: '1month', label: '1 Month' },
    { value: '3month', label: '3 Months' },
    { value: '6month', label: '6 Months' },
    { value: '12month', label: '1 Year' },
    { value: 'overall', label: 'All Time' },
  ];

  useEffect(() => {
    fetchChartData();
  }, [activeTab, timePeriod, username]);


  useEffect(() => {
    let cancelled = false;

    const hydrateSpotifyArtistImages = async () => {
      const artistNames = data
        .map((item) => item.name)
        .filter(Boolean);

      const uniqueArtists = [...new Set(artistNames)]
        .filter((artistName) => !spotifyArtistImages[artistName]);

      if (uniqueArtists.length === 0) return;

      const resolved = await Promise.all(
        uniqueArtists.map(async (artistName) => [artistName, await getSpotifyArtistImage(artistName)])
      );

      if (cancelled) return;

      setSpotifyArtistImages((previous) => {
        const next = { ...previous };
        resolved.forEach(([artistName, imageUrl]) => {
          if (imageUrl) next[artistName] = imageUrl;
        });
        return next;
      });
    };

    if (activeTab === 'artists' && data.length > 0) {
      hydrateSpotifyArtistImages();
    }

    return () => {
      cancelled = true;
    };
  }, [activeTab, data, spotifyArtistImages]);

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

  const getChangeIcon = () => {
    // Simulated change indicator (you can enhance this with historical data)
    const change = Math.random() * 10 - 5;
    if (change > 2) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (change < -2) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };


  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-white mb-8">Top Charts</h1>

        {/* Tab Selector */}
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

        {/* Time Period Selector */}
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

        {/* Chart Data */}
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      {activeTab === 'artists' ? 'Artist' : activeTab === 'albums' ? 'Album' : 'Track'}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Plays
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Open
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    (() => {
                      const artistName = item.artist?.name || item.artist?.['#text'];
                      const query = buildSearchQuery({
                        type: activeTab,
                        name: item.name,
                        artist: artistName,
                      });
                      const imageUrl = getLastFmImageUrl(item.image) || (activeTab === 'artists' ? spotifyArtistImages[item.name] : '');
                      const youTubeUrl = getYouTubeSearchUrl(query);
                      const spotifyUrl = getSpotifySearchUrl(query);

                      return (

                    <tr
                      key={index}
                      className="border-t border-gray-700 hover:bg-gray-700 transition"
                    >
                      <td className="px-6 py-4">
                        <span className="text-2xl font-bold text-purple-400">
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.name}
                              className="w-12 h-12 rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-300">
                              {item.name?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-white font-semibold">{item.name}</p>
                            {activeTab === 'tracks' && (
                              <p className="text-gray-400 text-sm">
                                {artistName}
                              </p>
                            )}
                            {activeTab === 'albums' && (
                              <p className="text-gray-400 text-sm">
                                {artistName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-semibold">
                          {parseInt(item.playcount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={youTubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                          >
                            YouTube
                          </a>
                          <a
                            href={spotifyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
                          >
                            Spotify
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getChangeIcon(index)}</td>
                    </tr>
                    );
                    })()

                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-400">
            No data available for this time period
          </div>
        )}
      </div>
    </div>
  );

}
