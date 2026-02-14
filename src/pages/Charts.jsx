import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, Loader2, Minus, TrendingDown, TrendingUp } from 'lucide-react';
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

export default function Charts({ username, initialTab = 'artists', lockTab = false, title = 'Top Charts', subtitle = 'Discover your most played music' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [timePeriod, setTimePeriod] = useState('7day');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spotifyImages, setSpotifyImages] = useState({});

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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
      ? <TrendingUp className="w-4 h-4 text-emerald-500" />
      : simulatedChange < -2
        ? <TrendingDown className="w-4 h-4 text-rose-500" />
        : <Minus className="w-4 h-4 text-muted" />;

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
      ...rows.map((row) => [row.rank, row.item.name || '', row.artistName || '', row.item.playcount || '']),
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
    <div className="min-h-screen bg-[#F5F5F5] p-8 relative">
      {/* Header with title and controls */}
      <div className="flex items-start justify-between mb-12">
        <div>
          <h1 className="text-[120px] font-bold text-black leading-none mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
            Top<br />Charts
          </h1>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          {!lockTab && (
            <>
              {['artists', 'albums', 'tracks'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-3 rounded-full text-lg transition-all ${
                    activeTab === tab
                      ? 'bg-gray-200 text-black shadow-sm'
                      : 'bg-white text-black border-2 border-gray-200 hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif', minWidth: '160px' }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Time Period Selector - Hidden for now to match design */}
      <div className="hidden">
        <select value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)}>
          {periods.map((period) => (
            <option key={period.value} value={period.value}>
              {period.label}
            </option>
          ))}
        </select>
      </div>

      {/* Export Buttons - Hidden for now to match design */}
      <div className="hidden">
        <button onClick={exportPng}>Export PNG</button>
        <button onClick={exportCsv}>Export CSV</button>
      </div>

      {loading ? (
  <div className="flex flex-col items-start py-20">
    <Loader2 className="w-10 h-10 text-black animate-spin mb-3" />
    <p className="text-black text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
      Loading your charts...
    </p>
  </div>
) : (

  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5 px-6 mt-10 items-start">

    {rows.map((row) => (

      <article
        key={row.key}
        className="
  flex items-center justify-between
  bg-[#EDEDED]
  rounded-full
  px-5 py-2
  hover:shadow-sm
  transition-all
  w-full
  max-w-[520px]
"
      >

        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">

          {/* RANK */}
          <span
            className="text-lg font-semibold w-5"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {row.rank}
          </span>

          {/* IMAGE */}
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-300">

  {row.imageUrl && (
    <img
      src={row.imageUrl}
      alt={row.item.name}
      className="w-full h-full object-cover"
    />
  )}

</div>

  
           : (
            <div className="w-10 h-10 rounded-full bg-gray-300" />
          )

          {/* NAME + PLAYS */}
          <div>
            <h3
              className="text-base leading-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {row.item.name}
            </h3>

            <p
              className="text-xs text-gray-500"
              style={{ fontFamily: 'Krub, sans-serif' }}
            >
              {Number(row.item.playcount || 0).toLocaleString()} plays
            </p>
          </div>

        </div>

        {/* RIGHT SIDE LINKS */}
        <div
          className="flex gap-3 text-xs"
          style={{ fontFamily: 'Krub, sans-serif' }}
        >
          <a
            href={row.youTubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FFB7C5] hover:underline"
          >
            YouTube
          </a>

          <a
            href={row.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#D5F3D8] hover:underline"
          >
            Spotify
          </a>
        </div>

      </article>

    ))}

  </div>

)}
    </div>
  );
}