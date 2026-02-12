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
    const changeIcon = simulatedChange > 2 ? <TrendingUp className="w-4 h-4 text-green-400" /> : simulatedChange < -2 ? <TrendingDown className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4 text-gray-400" />;
    return { key: `${item.name}-${artistName}-${index}`, rank: index + 1, item, artistName, imageUrl, spotifyUrl: getSpotifySearchUrl(query), youTubeUrl: getYouTubeSearchUrl(query), changeIcon };
  }), [activeTab, data, spotifyImages]);


  const exportPng = () => {
    const width = 1200;
    const rowHeight = 34;
    const height = Math.max(200, 100 + Math.min(rows.length, 30) * rowHeight);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`Music Scrobbler ${activeTab} (${timePeriod})`, 30, 44);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '16px sans-serif';
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
    const csvRows = [['Rank', 'Name', 'Artist', 'Playcount'], ...rows.map((row) => [row.rank, row.item.name || '', row.artistName || '', row.item.playcount || ''])];
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
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl font-bold text-white">Top Charts</h1>
          <button type="button" onClick={exportPng} className="inline-flex items-center gap-2 rounded-md border border-indigo-500/60 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-200 hover:bg-indigo-500/20"><Download className="h-4 w-4" /> Export PNG</button>
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-md border border-purple-500/60 bg-purple-500/10 px-3 py-2 text-sm text-purple-200 hover:bg-purple-500/20"><Download className="h-4 w-4" /> Export CSV</button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          {['artists', 'albums', 'tracks'].map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-lg font-semibold transition ${activeTab === tab ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Top {tab[0].toUpperCase()}{tab.slice(1)}</button>)}
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <label className="block text-gray-400 mb-2">Time Period ([ and ] keyboard shortcuts)</label>
          <select value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} className="w-full md:w-64 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none">
            {periods.map((period) => <option key={period.value} value={period.value}>{period.label}</option>)}
          </select>
        </div>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 text-purple-400 animate-spin" /></div> : (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.key} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center space-x-4 hover:border-purple-500 transition-colors">
                <div className="text-2xl font-bold text-purple-400 w-12">#{row.rank}</div>
                {row.imageUrl ? <img src={row.imageUrl} alt={row.item.name} className="w-16 h-16 rounded-lg object-cover" /> : <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center"><span className="text-gray-500 text-xs">No Image</span></div>}
                <div className="flex-1"><h3 className="text-xl font-semibold text-white">{row.item.name}</h3><p className="text-gray-400">{row.artistName}</p><p className="text-purple-400 font-medium">{Number(row.item.playcount || 0).toLocaleString()} plays</p></div>
                <div className="flex items-center space-x-4">{row.changeIcon}<a href={row.spotifyUrl} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">Spotify</a><a href={row.youTubeUrl} target="_blank" rel="noopener noreferrer" className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">YouTube</a></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
