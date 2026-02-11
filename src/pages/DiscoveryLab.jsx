import { useEffect, useMemo, useState } from 'react';
import { Compass, ExternalLink, Loader2, Radio, Sparkles, Wand2 } from 'lucide-react';
import { getArtistTopTracks, getSimilarArtists, getTopArtists } from '../services/lastfm';
import { getSpotifySearchUrl, getYouTubeSearchUrl } from '../utils/musicLinks';

const DiscoveryLab = ({ username }) => {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Discovery Lab</h1>
              <p className="mt-1 text-gray-400">
                Start from one favorite artist and generate a rabbit hole of similar artists and top tracks.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm">
                <Compass className="h-4 w-4 text-purple-300" />
                <select
                  value={seedArtist}
                  onChange={(event) => setSeedArtist(event.target.value)}
                  className="bg-transparent text-white focus:outline-none"
                >
                  {topArtists.map((artist) => (
                    <option key={artist.name} value={artist.name} className="text-gray-900">
                      {artist.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={randomizeSeed}
                className="inline-flex items-center gap-2 rounded-md border border-purple-500/50 bg-purple-500/10 px-3 py-2 text-sm text-purple-100 hover:bg-purple-500/20"
              >
                <Wand2 className="h-4 w-4" />
                Surprise me
              </button>
            </div>
          </div>

          {error && <p className="mt-4 rounded-md border border-red-700 bg-red-900/40 px-4 py-3 text-red-200">{error}</p>}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatTile label="Top artists scanned" value={topArtists.length} Icon={Radio} />
          <StatTile label="Similar artists found" value={recommendationRows.length} Icon={Sparkles} />
          <StatTile label="Top tracks from seed" value={topTracks.length} Icon={Compass} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold">Recommended artists</h2>
            {loadingSeedData ? (
              <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
            ) : recommendationRows.length === 0 ? (
              <p className="text-gray-400">No recommendations available yet.</p>
            ) : (
              <div className="space-y-3">
                {recommendationRows.map((artist) => (
                  <div key={artist.name} className="rounded-md border border-gray-700 bg-gray-700/60 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-medium">{artist.name}</p>
                      <span className="text-sm text-purple-200">{artist.match}% match</span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                      <div className="h-full bg-purple-500" style={{ width: `${artist.match}%` }} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <QuickLink label="Open on Spotify" url={artist.spotifyUrl} />
                      <QuickLink label="Search on YouTube" url={artist.youtubeUrl} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-xl border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold">Top tracks from {seedArtist || 'seed artist'}</h2>
            {loadingSeedData ? (
              <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
            ) : topTracks.length === 0 ? (
              <p className="text-gray-400">No tracks available for this artist.</p>
            ) : (
              <div className="space-y-3">
                {topTracks.map((track) => {
                  const searchQuery = `${track.name} ${track.artist?.name || seedArtist}`;

                  return (
                    <div key={`${track.name}-${track.rank || track.url || seedArtist}`} className="rounded-md border border-gray-700 bg-gray-700/60 px-4 py-3">
                      <p className="font-medium">{track.name}</p>
                      <p className="text-sm text-gray-300">{track.artist?.name || seedArtist}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
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
      </div>
    </div>
  );
};

const StatTile = ({ label, value, Icon }) => (
  <article className="rounded-lg border border-gray-700 bg-gray-800 p-4">
    <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
      {Icon ? <Icon className="h-4 w-4 text-purple-300" /> : null}
      <span>{label}</span>
    </div>
    <p className="text-2xl font-semibold text-white">{value}</p>
  </article>
);

const QuickLink = ({ label, url }) => (
  <a
    href={url}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-gray-200 transition hover:bg-gray-950"
  >
    <ExternalLink className="h-3 w-3" />
    {label}
  </a>
);

export default DiscoveryLab;
