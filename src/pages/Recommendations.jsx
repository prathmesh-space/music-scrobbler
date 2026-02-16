import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, ExternalLink, Sparkles, AlertTriangle } from 'lucide-react';
import { getTopArtists, getTopTracks } from '../services/lastfm';
import {
  buildSearchQuery,
  getSpotifySearchUrl,
  getYouTubeSearchUrl,
} from '../utils/musicLinks';

const RECOMMENDATION_LIBRARY = [
  { title: 'Starboy', artist: 'The Weeknd', relatedTo: ['the weeknd', 'dua lipa'] },
  { title: 'Less Than Zero', artist: 'The Weeknd', relatedTo: ['the weeknd'] },
  { title: 'Physical', artist: 'Dua Lipa', relatedTo: ['dua lipa'] },
  { title: 'Style', artist: 'Taylor Swift', relatedTo: ['taylor swift', 'harry styles'] },
  { title: 'The Less I Know The Better', artist: 'Tame Impala', relatedTo: ['glass animals', 'm83'] },
  { title: 'After Dark', artist: 'Mr.Kitty', relatedTo: ['m83', 'the weeknd'] },
  { title: '505', artist: 'Arctic Monkeys', relatedTo: ['oasis', 'the killers'] },
  { title: 'Read My Mind', artist: 'The Killers', relatedTo: ['the killers', 'oasis'] },
  { title: 'Riptide', artist: 'Vance Joy', relatedTo: ['ed sheeran', 'harry styles'] },
  { title: 'Feel Good Inc.', artist: 'Gorillaz', relatedTo: ['kendrick lamar', 'drake'] },
  { title: 'Borderline', artist: 'Tame Impala', relatedTo: ['daft punk', 'm83'] },
  { title: 'Electric Feel', artist: 'MGMT', relatedTo: ['daft punk', 'm83'] },
  { title: 'Stressed Out', artist: 'Twenty One Pilots', relatedTo: ['billie eilish', 'linkin park'] },
  { title: 'Dani California', artist: 'Red Hot Chili Peppers', relatedTo: ['nirvana', 'oasis'] },
  { title: 'All The Stars', artist: 'Kendrick Lamar & SZA', relatedTo: ['kendrick lamar', 'drake'] },
  { title: 'Flashing Lights', artist: 'Kanye West', relatedTo: ['drake', 'kendrick lamar', 'eminem'] },
  { title: 'Goosebumps', artist: 'Travis Scott', relatedTo: ['drake', 'kendrick lamar'] },
  { title: 'Nights', artist: 'Frank Ocean', relatedTo: ['the weeknd', 'drake'] },
  { title: 'Everybody Wants To Rule The World', artist: 'Tears for Fears', relatedTo: ['a-ha', 'queen'] },
  { title: 'The Chain', artist: 'Fleetwood Mac', relatedTo: ['fleetwood mac', 'queen'] },
  { title: 'Take Me Out', artist: 'Franz Ferdinand', relatedTo: ['the killers', 'arctic monkeys'] },
  { title: 'Do I Wanna Know?', artist: 'Arctic Monkeys', relatedTo: ['arctic monkeys', 'oasis'] },
  { title: 'Titanium', artist: 'David Guetta ft. Sia', relatedTo: ['dua lipa', 'ed sheeran'] },
  { title: 'On Melancholy Hill', artist: 'Gorillaz', relatedTo: ['m83', 'glass animals'] },
];

const normalize = (value) => (value || '').toLowerCase().trim();

const buildTasteSignature = (topArtists, topTracks) => {
  const artistNames = (topArtists || []).map((artist) => normalize(artist.name)).filter(Boolean);
  const trackNames = (topTracks || []).map((track) => normalize(track.name)).filter(Boolean);

  const tasteKeywords = trackNames
    .flatMap((trackName) => trackName.split(/\s+/g))
    .filter((word) => word.length >= 4);

  return {
    artistNames,
    tasteKeywords,
  };
};

const scoreRecommendation = (item, taste) => {
  const itemArtist = normalize(item.artist);
  const itemTitle = normalize(item.title);

  let score = 0;

  if (taste.artistNames.some((artist) => itemArtist.includes(artist) || artist.includes(itemArtist))) {
    score += 4;
  }

  if ((item.relatedTo || []).some((relatedArtist) => taste.artistNames.includes(normalize(relatedArtist)))) {
    score += 3;
  }

  if (taste.tasteKeywords.some((keyword) => itemTitle.includes(keyword))) {
    score += 1;
  }

  return score;
};

const hashString = (input) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const sortBySeed = (items, seed) =>
  [...items].sort((a, b) => {
    const aHash = hashString(`${seed}:${a.title}:${a.artist}`);
    const bHash = hashString(`${seed}:${b.title}:${b.artist}`);
    return aHash - bHash;
  });

export default function Recommendations({ username }) {
  const [rankedRecommendations, setRankedRecommendations] = useState([]);
  const [topTasteArtists, setTopTasteArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [discoveryLevel, setDiscoveryLevel] = useState(45);
  const [blendSeed, setBlendSeed] = useState(0);

  const loadTasteProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [topArtistsData, topTracksData] = await Promise.all([
        getTopArtists(username, '1month', 15),
        getTopTracks(username, '1month', 15),
      ]);

      const topArtists = topArtistsData?.artist || [];
      const topTracks = topTracksData?.track || [];

      const signature = buildTasteSignature(topArtists, topTracks);
      const ranked = RECOMMENDATION_LIBRARY
        .map((item) => ({
          ...item,
          score: scoreRecommendation(item, signature),
        }))
        .sort((a, b) => b.score - a.score);

      setRankedRecommendations(ranked);
      setTopTasteArtists(topArtists.slice(0, 3).map((artist) => artist.name));
      setBlendSeed((currentSeed) => currentSeed + 1);
    } catch (err) {
      console.error('Failed to generate personalized recommendations:', err);
      setError('Could not personalize recommendations right now. Showing random picks instead.');
      setRankedRecommendations(RECOMMENDATION_LIBRARY.map((item) => ({ ...item, score: 0 })));
      setTopTasteArtists([]);
      setBlendSeed((currentSeed) => currentSeed + 1);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadTasteProfile();
  }, [loadTasteProfile]);

  const recommendations = useMemo(() => {
    const safeLimit = 8;
    const discoveryRatio = Math.min(Math.max(discoveryLevel / 100, 0), 1);
    const explorationCount = Math.round(safeLimit * discoveryRatio);
    const familiarityCount = safeLimit - explorationCount;

    const familiarPool = sortBySeed(
      rankedRecommendations.filter((item) => item.score > 0),
      `familiar-${blendSeed}-${discoveryLevel}`,
    );
    const discoveryPool = sortBySeed(
      rankedRecommendations.filter((item) => item.score === 0),
      `discovery-${blendSeed}-${discoveryLevel}`,
    );

    const selected = [
      ...familiarPool.slice(0, familiarityCount),
      ...discoveryPool.slice(0, explorationCount),
    ];

    if (selected.length < safeLimit) {
      const used = new Set(selected.map((item) => `${item.title}-${item.artist}`));
      const fallback = sortBySeed(rankedRecommendations, `fallback-${blendSeed}-${discoveryLevel}`)
        .filter((item) => !used.has(`${item.title}-${item.artist}`));
      return [...selected, ...fallback].slice(0, safeLimit);
    }

    return selected.slice(0, safeLimit);
  }, [blendSeed, discoveryLevel, rankedRecommendations]);

  const tasteSummary = useMemo(() => {
    if (topTasteArtists.length) {
      return `Based on your taste: ${topTasteArtists.join(', ')} • ${discoveryLevel}% discovery mode`;
    }
    return 'Showing a fresh random mix while we learn your taste';
  }, [discoveryLevel, topTasteArtists]);

  const cards = useMemo(
    () =>
      recommendations.map((song) => {
        const query = buildSearchQuery({
          type: 'tracks',
          name: song.title,
          artist: song.artist,
        });

        return {
          ...song,
          youtubeUrl: getYouTubeSearchUrl(query),
          spotifyUrl: getSpotifySearchUrl(query),
        };
      }),
    [recommendations],
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <section className="rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-[#6B5A2A]" />
              <h2 className="font-['Amiri_Quran'] text-4xl font-normal text-[#3E3D1A]">
                Recommendations
              </h2>
            </div>
            <p className="mb-4 font-['Inter'] text-base text-[#6B5A2A]">
              {tasteSummary}
            </p>
            
            {/* Discovery Slider */}
            <div className="max-w-md">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-['Inter'] text-xs font-semibold uppercase tracking-wider text-[#3E3D1A]/70">
                  Familiar picks
                </span>
                <span className="font-['Inter'] text-xs font-semibold uppercase tracking-wider text-[#3E3D1A]/70">
                  {discoveryLevel}% Discovery
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={discoveryLevel}
                onChange={(event) => setDiscoveryLevel(Number(event.target.value))}
                aria-label="Discovery level"
                className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-[#CFD0B9] accent-[#6B5A2A]"
                style={{
                  background: `linear-gradient(to right, #6B5A2A 0%, #6B5A2A ${discoveryLevel}%, #CFD0B9 ${discoveryLevel}%, #CFD0B9 100%)`
                }}
              />
            </div>
          </div>
          
          <button
            type="button"
            onClick={loadTasteProfile}
            className="flex items-center gap-2 rounded-[25px] border-2 border-[#6B5A2A] bg-[#6B5A2A] px-5 py-3 font-['Inter'] text-base font-medium text-white shadow-md transition-all hover:bg-[#55491A] hover:border-[#55491A]"
          >
            <RefreshCw className="h-5 w-5" />
            Refresh picks
          </button>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <section className="rounded-[20px] border-2 border-amber-400 bg-amber-50 p-4 shadow-md">
          <p className="flex items-center gap-2 font-['Inter'] text-sm font-medium text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </p>
        </section>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#6B5A2A]" />
            <p className="font-['Inter'] text-base text-[#3E3D1A]">Finding perfect picks...</p>
          </div>
        </div>
      ) : (
        /* Recommendation Cards */
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((song, index) => {
            const gradients = [
              'from-[#EECEA4]/30 to-[#FFE5D9]/20',
              'from-[#E0F5F0]/30 to-[#C8E6D7]/20',
              'from-[#E8E0F5]/30 to-[#CFD0B9]/20',
              'from-[#FFE5D9]/30 to-[#EECEA4]/20',
            ];
            const gradient = gradients[index % gradients.length];

            return (
              <article
                key={`${song.title}-${song.artist}`}
                className={`rounded-[25px] bg-gradient-to-br ${gradient} p-5 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30 transition-all hover:scale-105 hover:shadow-xl`}
              >
                <div className="mb-4">
                  <p className="font-['Inter'] text-lg font-semibold text-[#3E3D1A] line-clamp-2">
                    {song.title}
                  </p>
                  <p className="mt-1 font-['Inter'] text-sm text-[#6B5A2A] line-clamp-1">
                    {song.artist}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={song.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-4 py-2 font-['Inter'] text-xs font-medium text-white transition-all hover:bg-red-600"
                  >
                    YouTube
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={song.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-2 font-['Inter'] text-xs font-medium text-white transition-all hover:bg-green-700"
                  >
                    Spotify
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}