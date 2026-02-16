import { useEffect, useMemo, useState } from 'react';
import { Compass, ExternalLink, Loader2, Radio, Sparkles, Wand2 } from 'lucide-react';
import { getArtistTopTracks, getSimilarArtists, getTopArtists } from '../services/lastfm';
import { getSpotifySearchUrl, getYouTubeSearchUrl } from '../utils/musicLinks';
import Recommendations from './Recommendations';

const DISCOVERY_TABS = ['lab', 'recommendations'];

const DiscoveryLab = ({ username }) => {
  const [activeTab, setActiveTab] = useState('lab');
  const [topArtists, setTopArtists] = useState([]);
  const [seedArtist, setSeedArtist] = useState('');
  const [similarArtists, setSimilarArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSeedData, setLoadingSeedData] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTopArtists = async () => {
      setLoading(true);
      setError('');

      try {
        const topArtistData = await getTopArtists(username, '1month', 24, 1);
        const artists = topArtistData?.artist || [];
        setTopArtists(artists);

        if (artists.length > 0) {
          setSeedArtist(artists[0].name);
        }
      } catch (fetchError) {
        console.error('Could not load top artists:', fetchError);
        setError('Could not load your top artists. Try refreshing this page.');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchTopArtists();
    }
  }, [username]);

  useEffect(() => {
    const fetchSeedData = async () => {
      if (!seedArtist) {
        setSimilarArtists([]);
        setTopTracks([]);
        return;
      }

      setLoadingSeedData(true);
      setError('');

      try {
        const [similarArtistData, artistTopTrackData] = await Promise.all([
          getSimilarArtists(seedArtist, 16),
          getArtistTopTracks(seedArtist, 12),
        ]);

        setSimilarArtists(similarArtistData?.artist || []);
        setTopTracks(artistTopTrackData?.track || []);
      } catch (fetchError) {
        console.error('Could not load seed artist data:', fetchError);
        setError('We could not generate recommendations from that artist right now.');
      } finally {
        setLoadingSeedData(false);
      }
    };

    fetchSeedData();
  }, [seedArtist]);

  const randomizeSeed = () => {
    if (topArtists.length === 0) {
      return;
    }

    const randomArtist = topArtists[Math.floor(Math.random() * topArtists.length)];
    setSeedArtist(randomArtist.name);
  };

  const recommendationRows = useMemo(
    () =>
      similarArtists.map((artist) => ({
        name: artist.name,
        match: Math.round(Number(artist.match || 0) * 100),
        spotifyUrl: getSpotifySearchUrl(artist.name),
        youtubeUrl: getYouTubeSearchUrl(artist.name),
      })),
    [similarArtists],
  );

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-12 w-12 animate-spin text-[#6B5A2A]" />
          <p className="font-['Inter'] text-lg text-[#3E3D1A]">Loading discovery lab...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ background: 'transparent' }}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="font-['Amiri_Quran'] text-7xl font-normal text-[#3E3D1A] md:text-8xl">
            Discovery
          </h1>
          <p className="mt-3 font-['Inter_Display'] text-lg font-light text-[#2D2D2D] md:text-xl">
            Explore new music through your favorite artists
          </p>
        </header>

        {/* Tabs */}
        <section className="mb-8 flex flex-wrap gap-3">
          {DISCOVERY_TABS.map((tab) => (
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
        </section>

        {activeTab === 'recommendations' ? (
          <Recommendations username={username} />
        ) : (
          <>
            {/* Controls Section */}
            <section className="mb-8 rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="font-['Amiri_Quran'] text-4xl font-normal text-[#3E3D1A]">
                    Discovery Lab
                  </h2>
                  <p className="mt-2 font-['Inter'] text-base text-[#6B5A2A]">
                    Start from one favorite artist and generate a rabbit hole of similar artists and top tracks
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-3 rounded-[25px] border-2 border-[#CFD0B9] bg-white px-5 py-3 shadow-md">
                    <Compass className="h-5 w-5 text-[#6B5A2A]" />
                    <select
                      value={seedArtist}
                      onChange={(event) => setSeedArtist(event.target.value)}
                      className="bg-transparent font-['Inter'] text-base text-[#3E3D1A] focus:outline-none cursor-pointer"
                    >
                      {topArtists.map((artist) => (
                        <option key={artist.name} value={artist.name}>
                          {artist.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={randomizeSeed}
                    className="flex items-center gap-2 rounded-[25px] border-2 border-[#6B5A2A] bg-[#6B5A2A] px-5 py-3 font-['Inter'] text-base text-white shadow-md transition-all hover:bg-[#55491A] hover:border-[#55491A]"
                  >
                    <Wand2 className="h-5 w-5" />
                    Surprise me
                  </button>
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-[20px] border-2 border-red-400 bg-red-50 px-5 py-3 font-['Inter'] text-sm text-red-800">
                  {error}
                </p>
              )}
            </section>

            {/* Stats Section */}
            <section className="mb-8 grid gap-4 md:grid-cols-3">
              <StatTile label="Top artists scanned" value={topArtists.length} icon="🎸" />
              <StatTile label="Similar artists found" value={recommendationRows.length} icon="✨" />
              <StatTile label="Top tracks from seed" value={topTracks.length} icon="🎵" />
            </section>

            {/* Content Grid */}
            <section className="grid gap-6 lg:grid-cols-2">
              {/* Recommended Artists */}
              <article className="rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
                <h2 className="mb-5 font-['Amiri_Quran'] text-3xl font-normal text-[#3E3D1A]">
                  Recommended Artists
                </h2>
                {loadingSeedData ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-[#6B5A2A]" />
                  </div>
                ) : recommendationRows.length === 0 ? (
                  <p className="py-8 text-center font-['Inter'] text-base text-[#6B5A2A]">
                    No recommendations available yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recommendationRows.map((artist) => (
                      <div
                        key={artist.name}
                        className="rounded-[18px] bg-gradient-to-r from-[#EECEA4]/20 to-[#FFE5D9]/20 p-4 ring-1 ring-[#CFD0B9]/30 transition-all hover:from-[#EECEA4]/40 hover:to-[#FFE5D9]/40"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="font-['Inter'] text-base font-semibold text-[#3E3D1A]">
                            {artist.name}
                          </p>
                          <span className="rounded-full bg-[#6B5A2A] px-3 py-1 font-['Inter'] text-xs font-semibold text-white">
                            {artist.match}% match
                          </span>
                        </div>

                        <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#CFD0B9]/30">
                          <div
                            className="h-full bg-[#6B5A2A] transition-all duration-500"
                            style={{ width: `${artist.match}%` }}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <QuickLink label="Spotify" url={artist.spotifyUrl} />
                          <QuickLink label="YouTube" url={artist.youtubeUrl} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              {/* Top Tracks */}
              <article className="rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
                <h2 className="mb-5 font-['Amiri_Quran'] text-3xl font-normal text-[#3E3D1A]">
                  Top Tracks
                </h2>
                <p className="mb-5 font-['Inter'] text-sm text-[#6B5A2A]">
                  from {seedArtist || 'seed artist'}
                </p>
                {loadingSeedData ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-[#6B5A2A]" />
                  </div>
                ) : topTracks.length === 0 ? (
                  <p className="py-8 text-center font-['Inter'] text-base text-[#6B5A2A]">
                    No tracks available for this artist
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topTracks.map((track) => {
                      const searchQuery = `${track.name} ${track.artist?.name || seedArtist}`;

                      return (
                        <div
                          key={`${track.name}-${track.rank || track.url || seedArtist}`}
                          className="rounded-[18px] bg-gradient-to-r from-[#E0F5F0]/30 to-[#C8E6D7]/20 p-4 ring-1 ring-[#CFD0B9]/30 transition-all hover:from-[#E0F5F0]/50 hover:to-[#C8E6D7]/40"
                        >
                          <p className="font-['Inter'] text-base font-semibold text-[#3E3D1A]">
                            {track.name}
                          </p>
                          <p className="mt-1 font-['Inter'] text-sm text-[#6B5A2A]">
                            {track.artist?.name || seedArtist}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <QuickLink label="Spotify" url={getSpotifySearchUrl(searchQuery)} />
                            <QuickLink label="YouTube" url={getYouTubeSearchUrl(searchQuery)} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

const StatTile = ({ label, value, icon }) => (
  <article className="rounded-[25px] bg-gradient-to-br from-[#EECEA4]/40 to-[#FFE5D9]/30 p-5 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30 transition-all hover:scale-105 hover:shadow-xl">
    <div className="mb-3 flex items-center justify-between">
      <p className="font-['Inter'] text-xs font-semibold uppercase tracking-wider text-[#3E3D1A]/70">
        {label}
      </p>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className="font-['Inter'] text-3xl font-bold text-[#3E3D1A]">{value}</p>
  </article>
);

const QuickLink = ({ label, url }) => (
  <a
    href={url}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-1.5 rounded-full bg-[#55491A] px-3 py-1.5 font-['Inter'] text-xs text-[#CFD0B9] transition-all hover:bg-[#6B5A2A]"
  >
    <ExternalLink className="h-3 w-3" />
    {label}
  </a>
);

export default DiscoveryLab;