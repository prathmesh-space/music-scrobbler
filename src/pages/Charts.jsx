import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { getTopAlbums, getTopArtists, getTopTracks } from '../services/lastfm';
import { getSpotifyAlbumImage, getSpotifyArtistImage, getSpotifyTrackImage } from '../services/spotify';
import { buildSearchQuery, getSpotifySearchUrl, getYouTubeSearchUrl } from '../utils/musicLinks';
import { getLastFmImageUrl } from '../utils/lastfmImage.js';
import { getCachedData, setCachedData } from '../utils/cache';
import Statistics from './Statistics';
import Collage from './Collage';

const PERIODS = [
  { value: '7day', label: '7 Days' },
  { value: '1month', label: '1 Month' },
  { value: '3month', label: '3 Months' },
  { value: '6month', label: '6 Months' },
  { value: '12month', label: '1 Year' },
  { value: 'overall', label: 'All Time' },
];

const TABS = ['artists', 'albums', 'tracks'];
const SECTIONS = ['charts', 'statistics', 'collage'];

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
  const [activeSection, setActiveSection] = useState('charts');
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
    <div className="min-h-screen p-8" style={{ background: 'transparent' }}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-5">
          <div>
            <h1 className="font-['Amiri_Quran'] text-7xl font-normal text-[#3E3D1A] md:text-8xl">
              {title}
            </h1>
            <p className="mt-3 font-['Inter_Display'] text-lg font-light text-[#2D2D2D] md:text-xl">
              {subtitle}
            </p>
          </div>

          {/* Section Tabs */}
          <div className="flex flex-wrap gap-3">
            {SECTIONS.map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={`rounded-[59px] px-8 py-4 text-base font-normal transition-all duration-300 md:text-lg ${
                  activeSection === section
                    ? 'bg-[#6B5A2A] text-[#CFD0B9] shadow-[0_4px_4px_rgba(0,0,0,0.25)]'
                    : 'bg-[#55491A] text-[#CFD0B9] hover:bg-[#6B5A2A]'
                }`}
              >
                {section[0].toUpperCase() + section.slice(1)}
              </button>
            ))}
          </div>
        </header>

        {activeSection === 'charts' ? (
          <>
            {/* 🔥 CHANGE 2: Bigger Buttons 🔥 */}
            <div className="mb-8 flex flex-wrap items-center gap-4">
              {/* Tab Buttons - BIGGER */}
              {!lockTab &&
                TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-[59px] px-8 py-4 text-lg font-normal transition-all duration-300 ${
                      activeTab === tab
                        ? 'bg-[#EECEA4] text-[#3E3D1A] shadow-[0_4px_4px_rgba(0,0,0,0.25)]'
                        : 'bg-[#55491A] text-[#CFD0B9] hover:bg-[#6B5A2A]'
                    }`}
                  >
                    {tab[0].toUpperCase() + tab.slice(1)}
                  </button>
                ))}

              {/* Time Period Selector - BIGGER */}
              <select
                value={timePeriod}
                onChange={(event) => setTimePeriod(event.target.value)}
                className="rounded-[59px] border-2 border-[#CFD0B9] bg-[#55491A] px-8 py-4 text-lg font-normal text-[#CFD0B9] shadow-sm transition-all hover:bg-[#6B5A2A] focus:border-[#EECEA4] focus:outline-none focus:ring-2 focus:ring-[#EECEA4]/50"
              >
                {PERIODS.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 50-50 Split */}
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', height: 'calc(100vh - 22rem)' }}>
              
              {/* LEFT: Charts Section - 50% */}
              <div style={{ 
                flex: '1 1 50%', 
                minWidth: '0',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {loading ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    padding: '5rem 0',
                    height: '100%'
                  }}>
                    <Loader2 className="h-6 w-6 animate-spin text-[#6B5A2A]" />
                    <span className="font-['Inter'] text-lg text-[#3E3D1A]">
                      Loading your charts…
                    </span>
                  </div>
                ) : rows.length === 0 ? (
                  <p style={{
                    padding: '5rem 0',
                    textAlign: 'center',
                    fontFamily: 'Inter',
                    fontSize: '1rem',
                    color: '#6B5A2A',
                    height: '100%'
                  }}>
                    No chart data available for this range yet.
                  </p>
                ) : (
                  <div 
                    style={{ 
                      height: '100%',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      padding: '1.25rem',
                      borderRadius: '25px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(207, 208, 185, 0.3)'
                    }}
                  >
                    {/* 🔥 CHANGE 1: Bigger List Cards 🔥 */}
                    {rows.slice(0, 50).map((row) => (
                      <article
                        key={row.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1.25rem',
                          padding: '1.25rem',
                          marginBottom: '0.75rem',
                          backgroundColor: 'rgba(238, 206, 164, 0.3)',
                          borderRadius: '18px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          color: '#3E3D1A',
                          minWidth: '3rem',
                          textAlign: 'center'
                        }}>
                          {row.rank}
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flex: '1',
                          gap: '1.25rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            flex: '1',
                            minWidth: '0'
                          }}>
                            {row.imageUrl && (
                              <img
                                src={row.imageUrl}
                                alt={row.name}
                                style={{
                                  width: '64px',
                                  height: '64px',
                                  borderRadius: '10px',
                                  objectFit: 'cover',
                                  flexShrink: '0'
                                }}
                              />
                            )}
                            <div style={{
                              minWidth: '0',
                              overflow: 'hidden'
                            }}>
                              <h3 style={{
                                fontFamily: 'Inter',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                color: '#3E3D1A',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {row.name}
                              </h3>
                              <p style={{
                                fontFamily: 'Inter',
                                fontSize: '0.95rem',
                                color: '#6B5A2A',
                                marginTop: '0.35rem'
                              }}>
                                Plays {row.plays.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.85rem',
                            fontFamily: 'Inter',
                            flexShrink: '0'
                          }}>
                            <a
                              href={row.youTubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#6B5A2A',
                                textDecoration: 'none'
                              }}
                            >
                              youtube
                            </a>
                            <span style={{ color: '#6B5A2A' }}>/</span>
                            <a
                              href={row.spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#6B5A2A',
                                textDecoration: 'none'
                              }}
                            >
                              spotify
                            </a>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Statistics Sidebar - 50% */}
              <div style={{ 
                flex: '1 1 50%', 
                minWidth: '0',
                height: '100%'
              }}>
                <div 
                  style={{ 
                    height: '100%',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    padding: '1rem',
                    borderRadius: '25px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(207, 208, 185, 0.3)'
                  }}
                >
                  <Statistics username={username} embedded />
                </div>
              </div>
            </div>
          </>
        ) : activeSection === 'statistics' ? (
          <Statistics username={username} embedded={false} />
        ) : (
          <Collage username={username} embedded />
        )}
      </div>
    </div>
  );
}