import { useEffect, useMemo, useState } from 'react';
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

const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

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

const createRecommendations = (library, taste, limit = 8) => {
  const ranked = library
    .map((item) => ({
      ...item,
      score: scoreRecommendation(item, taste),
    }))
    .sort((a, b) => b.score - a.score);

  const topRanked = ranked.filter((item) => item.score > 0);
  const fallback = shuffle(ranked.filter((item) => item.score === 0));

  return [...topRanked, ...fallback].slice(0, limit);
};

export default function Recommendations({ username }) {
  const [recommendations, setRecommendations] = useState([]);
  const [tasteSummary, setTasteSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const generateForTaste = async () => {
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
      const picks = createRecommendations(RECOMMENDATION_LIBRARY, signature, 8);

      setRecommendations(picks);
      setTasteSummary(
        topArtists.length
          ? `Based on your taste: ${topArtists.slice(0, 3).map((artist) => artist.name).join(', ')}`
          : 'Showing a fresh random mix while we learn your taste.',
      );
    } catch (err) {
      console.error('Failed to generate personalized recommendations:', err);
      setError('Could not personalize recommendations right now. Showing random picks instead.');
      setRecommendations(shuffle(RECOMMENDATION_LIBRARY).slice(0, 8));
      setTasteSummary('Showing a fresh random mix while personalization is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateForTaste();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

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
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-xl border border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
                <Sparkles className="h-8 w-8 text-purple-300" />
                Recommendations for you
              </h1>
              <p className="mt-2 text-gray-300">
                {tasteSummary || 'Building picks from your listening taste...'}
              </p>
            </div>
            <button
              type="button"
              onClick={generateForTaste}
              className="inline-flex items-center gap-2 rounded-md border border-purple-500 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200 transition hover:bg-purple-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh picks
            </button>
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
            {cards.map((song) => (
              <article
                key={`${song.title}-${song.artist}`}
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
