import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { getTopAlbums, getTopArtists, getTopTracks } from '../services/lastfm';
import { getSpotifyAlbumImage, getSpotifyArtistImage, getSpotifyTrackImage } from '../services/spotify';
import { buildSearchQuery, getSpotifySearchUrl, getYouTubeSearchUrl } from '../utils/musicLinks';
import { getLastFmImageUrl } from '../utils/lastfmImage.js';
import { getCachedData, setCachedData } from '../utils/cache';

const periods = [
  { value: '7day', label: '7 Days' },
  { value: '1month', label: '1 Month' },
  { value: '3month', label: '3 Months' },
  { value: '6month', label: '6 Months' },
  { value: '12month', label: '1 Year' },
  { value: 'overall', label: 'All Time' },
];

const extractArtistName = (item) => item.artist?.name || item.artist?.['#text'] || '';
const buildImageCacheKey = (item, type) => (type === 'artists' ? `artist:${item.name}` : `${type}:${item.name}:${extractArtistName(item)}`);

export default function Charts({ username }) {
  const [activeTab, setActiveTab] = useState('artists');
  const [timePeriod, setTimePeriod] = useState('7day');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spotifyImages, setSpotifyImages] = useState({});

  useEffect(() => {
    const onRange = (event) => {
      const idx = periods.findIndex((option) => option.value === timePeriod);
      const nextIndex = Math.min(periods.length - 1, Math.max(0, idx + Number(event.detail || 0)));
      setTimePeriod(periods[nextIndex].value);
    };
    window.addEventListener('music-scrobbler:range', onRange);
    return () => window.removeEventListener('music-scrobbler:range', onRange);
  }, [timePeriod]);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        let result;
        if (activeTab === 'artists') result = await getTopArtists(username, timePeriod, 50);
        else if (activeTab === 'albums') result = await getTopAlbums(username, timePeriod, 50);
        else result = await getTopTracks(username, timePeriod, 50);

        const list = result?.[activeTab === 'artists' ? 'artist' : activeTab === 'albums' ? 'album' : 'track'] || [];
        setData(list);
        setCachedData(`charts:${username}:${activeTab}:${timePeriod}`, list);
      } catch {
        const cached = getCachedData(`charts:${username}:${activeTab}:${timePeriod}`) || [];
        setData(Array.isArray(cached) ? cached : []);
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
          if (activeTab === 'artists') return [cacheKey, await getSpotifyArtistImage(item.name || '')];
          if (activeTab === 'albums') return [cacheKey, await getSpotifyAlbumImage({ albumName: item.name || '', artistName })];
          return [cacheKey, await getSpotifyTrackImage({ trackName: item.name || '', artistName })];
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

    if (data.length > 0) hydrateSpotifyImages();
    return () => {
      cancelled = true;
    };
  }, [activeTab, data, spotifyImages]);

  const rows = useMemo(() => data.map((item, index) => {
    const artistName = extractArtistName(item);
    const query = buildSearchQuery({ type: activeTab, name: item.name, artist: artistName });
    const cacheKey = buildImageCacheKey(item, activeTab);
    const imageUrl = getLastFmImageUrl(item.image) || spotifyImages[cacheKey] || '';
    const simulatedChange = Math.random() * 10 - 5;
    const changeIcon = simulatedChange > 2 
      ? <TrendingUp className="w-4 h-4 text-accent" /> 
      : simulatedChange < -2 
      ? <TrendingDown className="w-4 h-4 text-primary" /> 
      : <Minus className="w-4 h-4 text-muted" />;
    return { 
      key: `${item.name}-${artistName}-${index}`, 
      rank: index + 1, 
      item, 
      artistName, 
      imageUrl, 
      spotifyUrl: getSpotifySearchUrl(query), 
      youTubeUrl: getYouTubeSearchUrl(query), 
      changeIcon 
    };
  }), [activeTab, data, spotifyImages]);

  const exportPng = () => {
    const width = 1200;
    const rowHeight = 34;
    const height = Math.max(200, 100 + Math.min(rows.length, 30) * rowHeight);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#F2C7C7';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#FFB7C5';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText(`Music Scrobbler ${activeTab} (${timePeriod})`, 30, 44);
    ctx.fillStyle = '#1F1F1F';
    ctx.font = '16px Krub, sans-serif';
    rows.slice(0, 30).forEach((row, index) => {
      const y = 80 + index * rowHeight;
      ctx.fillText(`#${row.rank}  ${row.item.name} — ${row.artistName} (${row.item.playcount || 0})`, 30, y);
    });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${username || 'listener'}-${activeTab}-${timePeriod}.png`;
    link.click();
  };

  const exportCsv = () => {
    const csvRows = [
      ['Rank', 'Name', 'Artist', 'Playcount'], 
      ...rows.map((row) => [row.rank, row.item.name || '', row.artistName || '', row.item.playcount || ''])
    ];
    const csv = csvRows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${username || 'listener'}-${activeTab}-${timePeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container max-w-5xl">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-8 mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl font-bold text-text mb-2">Top Charts</h1>
            <p className="text-muted text-sm">Discover your most played music</p>
          </div>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={exportPng} 
              className="inline-flex items-center gap-2 rounded-full bg-accent text-text px-5 py-2.5 text-sm font-semibold hover:bg-accent/80 transition-all shadow-md hover:shadow-lg"
            >
              <Download className="h-4 w-4" /> Export PNG
            </button>
            <button 
              type="button" 
              onClick={exportCsv} 
              className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Tab Selector */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-primary/10">
          <label className="text-muted text-xs font-semibold mb-3 block uppercase tracking-wide">Category</label>
          <div className="flex gap-2">
            {['artists', 'albums', 'tracks'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === tab 
                    ? 'bg-primary text-white shadow-md ring-2 ring-primary/20' 
                    : 'bg-border/60 text-muted shadow-sm hover:bg-primary/10 hover:text-text hover:shadow-md'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Time Period Selector */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-primary/10">
          <label className="text-muted text-xs font-semibold mb-3 block uppercase tracking-wide">Time Period</label>
          <select 
            value={timePeriod} 
            onChange={(e) => setTimePeriod(e.target.value)} 
            className="w-full px-4 py-2.5 bg-border/70 rounded-xl text-text font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-md border border-primary/10"
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts List - Fixed Size Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-lg">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-muted text-sm">Loading your charts...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div 
              key={row.key} 
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-primary/10 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center gap-5">
                {/* Rank Badge - Fixed Size */}
                <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-heading font-bold text-lg shadow-md ${
                  row.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900' :
                  row.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' :
                  row.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-orange-900' :
                  'bg-gradient-to-br from-primary/30 to-accent/30 text-text'
                }`}>
                  {row.rank}
                </div>

                {/* Image - Fixed Size */}
                <div className="flex-shrink-0">
                  {row.imageUrl ? (
                    <img 
                      src={row.imageUrl} 
                      alt={row.item.name} 
                      className="w-14 h-14 rounded-lg object-cover shadow-md ring-1 ring-primary/10"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-border to-primary/10 flex items-center justify-center shadow-md ring-1 ring-primary/10">
                      <span className="text-muted text-[10px] font-medium">No Art</span>
                    </div>
                  )}
                </div>

                {/* Info - Flexible Width */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-heading font-bold text-text truncate mb-1">
                    {row.item.name}
                  </h3>
                  <p className="text-muted text-sm truncate mb-2">{row.artistName}</p>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                      {Number(row.item.playcount || 0).toLocaleString()} plays
                    </span>
                    <span className="text-muted">
                      {row.changeIcon}
                    </span>
                  </div>
                </div>

                {/* Actions - Fixed Size Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  <a 
                    href={row.spotifyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-5 py-2.5 rounded-xl bg-accent text-text text-sm font-bold hover:bg-accent/80 transition-all shadow-md hover:shadow-lg text-center whitespace-nowrap"
                  >
                    🎵 Spotify
                  </a>
                  <a 
                    href={row.youTubeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg text-center whitespace-nowrap"
                  >
                    ▶️ YouTube
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
