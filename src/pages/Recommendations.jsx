import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, ExternalLink, Sparkles, AlertTriangle } from 'lucide-react';
import {
  getArtistTopTracks,
  getSimilarArtists,
  getTopArtists,
  getTopTracks,
} from '../services/lastfm';
import {
  buildSearchQuery,
  getSpotifySearchUrl,
  getYouTubeSearchUrl,
} from '../utils/musicLinks';

const FALLBACK_RECOMMENDATIONS = [
  { title: 'Starboy', artist: 'The Weeknd', score: 0.2, source: 'fallback' },
  { title: 'Physical', artist: 'Dua Lipa', score: 0.2, source: 'fallback' },
  { title: 'Read My Mind', artist: 'The Killers', score: 0.2, source: 'fallback' },
  { title: 'Electric Feel', artist: 'MGMT', score: 0.2, source: 'fallback' },
  { title: 'Take Me Out', artist: 'Franz Ferdinand', score: 0.2, source: 'fallback' },
  { title: 'Flashing Lights', artist: 'Kanye West', score: 0.2, source: 'fallback' },
  { title: 'On Melancholy Hill', artist: 'Gorillaz', score: 0.2, source: 'fallback' },
  { title: '505', artist: 'Arctic Monkeys', score: 0.2, source: 'fallback' },
  { title: 'Less Than Zero', artist: 'The Weeknd', score: 0.2, source: 'fallback' },
  { title: 'After Dark', artist: 'Mr.Kitty', score: 0.2, source: 'fallback' },
  { title: 'Riptide', artist: 'Vance Joy', score: 0.2, source: 'fallback' },
  { title: 'Nights', artist: 'Frank Ocean', score: 0.2, source: 'fallback' },
];

const MAX_CARDS = 8;
const TOP_ARTIST_SEEDS = 6;
const TOP_TRACK_HISTORY = 60;
const SIMILAR_ARTISTS_LIMIT = 10;
const ARTIST_TRACK_LIMIT = 8;

const normalize = (value) => (value || '').trim().toLowerCase();

const trackKey = (track) => `${normalize(track.artist)}::${normalize(track.title)}`;

const parsePlaycount = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const hashString = (input) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const seededShuffle = (items, seed) =>
  [...items].sort((a, b) => {
    const aHash = hashString(`${seed}:${trackKey(a)}`);
    const bHash = hashString(`${seed}:${trackKey(b)}`);
    return aHash - bHash;
  });

const buildKnownTrackSet = (topTracks) =>
  new Set(
    (topTracks || []).map((track) =>
      trackKey({
        artist: track?.artist?.name || track?.artist,
        title: track?.name,
      }),
    ),
  );

const buildSeedArtists = (topArtists) => {
  const maxWeight = Math.max(...(topArtists || []).map((artist) => parsePlaycount(artist.playcount)), 1);

  return (topArtists || []).slice(0, TOP_ARTIST_SEEDS).map((artist, index) => {
    const playcount = parsePlaycount(artist.playcount);
    const recencyWeight = (TOP_ARTIST_SEEDS - index) / TOP_ARTIST_SEEDS;
    const playWeight = maxWeight ? playcount / maxWeight : 0;

    return {
      name: artist.name,
      weight: 0.4 + recencyWeight * 0.35 + playWeight * 0.25,
    };
  });
};

const buildTrackCard = (track) => {
  const query = buildSearchQuery({
    type: 'tracks',
    name: track.title,
    artist: track.artist,
  });

  return {
    ...track,
    youtubeUrl: getYouTubeSearchUrl(query),
    spotifyUrl: getSpotifySearchUrl(query),
  };
};

const getPersonalizedRecommendations = async (username) => {
  const [topArtistsData, topTracksData] = await Promise.all([
    getTopArtists(username, '1month', TOP_ARTIST_SEEDS),
    getTopTracks(username, '3month', TOP_TRACK_HISTORY),
  ]);

  const topArtists = topArtistsData?.artist || [];
  const topTracks = topTracksData?.track || [];

  if (!topArtists.length) {
    return {
      topArtists,
      picks: FALLBACK_RECOMMENDATIONS,
      source: 'fallback',
    };
  }

  const knownTrackKeys = buildKnownTrackSet(topTracks);
  const seedArtists = buildSeedArtists(topArtists);

  const similarResponses = await Promise.allSettled(
    seedArtists.map((seed) => getSimilarArtists(seed.name, SIMILAR_ARTISTS_LIMIT)),
  );

  const candidateArtists = new Map();

  similarResponses.forEach((result, index) => {
    if (result.status !== 'fulfilled') {
      return;
    }

    const seedWeight = seedArtists[index].weight;
    const similarArtists = result.value?.artist || [];

    similarArtists.forEach((artist, similarRank) => {
      const artistName = artist?.name;
      if (!artistName) {
        return;
      }

      const key = normalize(artistName);
      const similarity = Number.parseFloat(artist.match || '0');
      const rankWeight = (SIMILAR_ARTISTS_LIMIT - similarRank) / SIMILAR_ARTISTS_LIMIT;
      const scoreBoost = (Number.isFinite(similarity) ? similarity : 0) * 2 + rankWeight;

      const existing = candidateArtists.get(key);
      if (existing) {
        existing.score += scoreBoost * seedWeight;
        existing.sources.push(seedArtists[index].name);
      } else {
        candidateArtists.set(key, {
          name: artistName,
          score: scoreBoost * seedWeight,
          sources: [seedArtists[index].name],
        });
      }
    });
  });

  const topCandidateArtists = [...candidateArtists.values()]
    .filter((artist) => !seedArtists.some((seed) => normalize(seed.name) === normalize(artist.name)))
    .sort((a, b) => b.score - a.score)
    .slice(0, 14);

  const candidateTrackResponses = await Promise.allSettled(
    topCandidateArtists.map((artist) => getArtistTopTracks(artist.name, ARTIST_TRACK_LIMIT)),
  );

  const candidateTracks = new Map();

  candidateTrackResponses.forEach((result, index) => {
    if (result.status !== 'fulfilled') {
      return;
    }

    const artistScore = topCandidateArtists[index].score;
    const tracks = result.value?.track || [];

    tracks.forEach((track, trackRank) => {
      const title = track?.name;
      const artistName = track?.artist?.name || topCandidateArtists[index].name;

      if (!title || !artistName) {
        return;
      }

      const key = trackKey({ title, artist: artistName });
      if (knownTrackKeys.has(key)) {
        return;
      }

      const playcount = parsePlaycount(track.playcount);
      const playcountWeight = Math.log10(playcount + 10) / 3;
      const rankWeight = (ARTIST_TRACK_LIMIT - trackRank) / ARTIST_TRACK_LIMIT;
      const score = artistScore * 0.7 + playcountWeight * 0.2 + rankWeight * 0.1;

      const existing = candidateTracks.get(key);
      if (existing) {
        existing.score = Math.max(existing.score, score);
      } else {
        candidateTracks.set(key, {
          title,
          artist: artistName,
          score,
          source: 'personalized',
        });
      }
    });
  });

  const picks = [...candidateTracks.values()].sort((a, b) => b.score - a.score);

  if (!picks.length) {
    return {
      topArtists,
      picks: FALLBACK_RECOMMENDATIONS,
      source: 'fallback',
    };
  }

  return {
    topArtists,
    picks,
    source: 'personalized',
  };
};

export default function Recommendations({ username }) {
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [topTasteArtists, setTopTasteArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [discoveryLevel, setDiscoveryLevel] = useState(45);
  const [blendSeed, setBlendSeed] = useState(0);

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getPersonalizedRecommendations(username);
      setAllRecommendations(result.picks);
      setTopTasteArtists((result.topArtists || []).slice(0, 3).map((artist) => artist.name));

      if (result.source === 'fallback') {
        setError('Personalized signals were limited, so we loaded high-quality fallback picks.');
      }
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
      setError('Could not personalize recommendations right now. Showing curated fallback picks.');
      setAllRecommendations(FALLBACK_RECOMMENDATIONS);
      setTopTasteArtists([]);
    } finally {
      setBlendSeed((currentSeed) => currentSeed + 1);
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const remixRecommendations = useCallback(() => {
    setBlendSeed((currentSeed) => currentSeed + 1);
  }, []);

  const recommendationCards = useMemo(() => {
    const discoveryRatio = clamp(discoveryLevel / 100, 0, 1);
    const familiarCount = Math.round(MAX_CARDS * (1 - discoveryRatio));

    const personalized = allRecommendations.filter((item) => item.source === 'personalized');
    const fallback = allRecommendations.filter((item) => item.source !== 'personalized');

    const familiarPool = seededShuffle(personalized, `familiar-${blendSeed}-${discoveryLevel}`);
    const discoveryPool = seededShuffle(fallback, `discovery-${blendSeed}-${discoveryLevel}`);

    const selected = [
      ...familiarPool.slice(0, familiarCount),
      ...discoveryPool.slice(0, MAX_CARDS - familiarCount),
    ];

    if (selected.length < MAX_CARDS) {
      const used = new Set(selected.map(trackKey));
      const refillPool = seededShuffle(allRecommendations, `refill-${blendSeed}-${discoveryLevel}`).filter(
        (item) => !used.has(trackKey(item)),
      );

      selected.push(...refillPool.slice(0, MAX_CARDS - selected.length));
    }

    return seededShuffle(selected.slice(0, MAX_CARDS), `final-${blendSeed}-${discoveryLevel}`).map(buildTrackCard);
  }, [allRecommendations, blendSeed, discoveryLevel]);

  const tasteSummary = useMemo(() => {
    if (topTasteArtists.length) {
      return `Built from your taste graph: ${topTasteArtists.join(', ')} • ${discoveryLevel}% discovery mode`;
    }

    return `Smart fallback mode • ${discoveryLevel}% discovery mode`;
  }, [discoveryLevel, topTasteArtists]);

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-xl border border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
                <Sparkles className="h-8 w-8 text-purple-300" />
                Recommendations for you
              </h1>
              <p className="mt-2 text-gray-300">{tasteSummary}</p>
              <div className="mt-4 max-w-md">
                <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-400">
                  <span>Familiar picks</span>
                  <span>{discoveryLevel}% Discovery</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={discoveryLevel}
                  onChange={(event) => setDiscoveryLevel(Number(event.target.value))}
                  aria-label="Discovery level"
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-purple-400"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={loadRecommendations}
                className="inline-flex items-center gap-2 rounded-md border border-purple-500 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200 transition hover:bg-purple-500/20"
              >
                <RefreshCw className="h-4 w-4" />
                Rebuild recommendations
              </button>
              <button
                type="button"
                onClick={remixRecommendations}
                className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-700/50 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-700"
              >
                <RefreshCw className="h-4 w-4" />
                Remix picks
              </button>
            </div>
          </div>
        </section>

        {error && (
          <section className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
            <p className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </p>
          </section>
        )}

        {loading ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-gray-700 bg-gray-800">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recommendationCards.map((song) => (
              <article
                key={trackKey(song)}
                className="rounded-lg border border-gray-700 bg-gray-800 p-5"
              >
                <p className="text-lg font-semibold text-white">{song.title}</p>
                <p className="mt-1 text-sm text-gray-400">{song.artist}</p>

                <div className="mt-4 flex gap-2">
                  <a
                    href={song.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/30"
                  >
                    YouTube
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href={song.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/30"
                  >
                    Spotify
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
