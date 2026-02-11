import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Download,
  Loader2,
  PencilLine,
  RefreshCcw,
  Save,
} from 'lucide-react';
import { getRecentTracks } from '../services/lastfm';

const GOAL_STORAGE_KEY = 'music-scrobbler-goals';

const defaultGoals = {
  weeklyScrobbles: 120,
  weeklyArtists: 35,
  weeklyDiscovery: 20,
};

const getStoredGoals = () => {
  try {
    const rawGoals = localStorage.getItem(GOAL_STORAGE_KEY);
    if (!rawGoals) {
      return defaultGoals;
    }

    const parsedGoals = JSON.parse(rawGoals);
    return {
      weeklyScrobbles: Number(parsedGoals.weeklyScrobbles) || defaultGoals.weeklyScrobbles,
      weeklyArtists: Number(parsedGoals.weeklyArtists) || defaultGoals.weeklyArtists,
      weeklyDiscovery: Number(parsedGoals.weeklyDiscovery) || defaultGoals.weeklyDiscovery,
    };
  } catch (error) {
    console.error('Failed to parse listening goals:', error);
    return defaultGoals;
  }
};

const weekInSeconds = 7 * 24 * 60 * 60;

const ListeningGoals = ({ username }) => {
  const [goals, setGoals] = useState(() => getStoredGoals());
  const [draftGoals, setDraftGoals] = useState(() => getStoredGoals());
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekSummary, setWeekSummary] = useState({
    scrobbles: 0,
    uniqueArtists: 0,
    discoveryArtists: 0,
    streakDays: 0,
    weekTracks: [],
  });

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const recentTrackData = await getRecentTracks(username, 200, 1);
      const allTracks = recentTrackData?.track || [];
      const nowInSeconds = Math.floor(Date.now() / 1000);

      const weekTracks = allTracks.filter((track) => {
        const uts = Number(track?.date?.uts || 0);
        return uts > 0 && nowInSeconds - uts <= weekInSeconds;
      });

      const uniqueArtists = new Set(
        weekTracks
          .map((track) => track.artist?.['#text'] || track.artist?.name || '')
          .filter(Boolean),
      );

      const allHistoricalArtists = new Set(
        allTracks
          .map((track) => track.artist?.['#text'] || track.artist?.name || '')
          .filter(Boolean),
      );

      const discoveryArtists = [...uniqueArtists].filter((artist) => {
        const totalOccurrences = allTracks.filter((track) => {
          const artistName = track.artist?.['#text'] || track.artist?.name || '';
          return artistName === artist;
        }).length;
        return totalOccurrences <= 2;
      });

      const streakDays = calculateStreakDays(weekTracks);

      setWeekSummary({
        scrobbles: weekTracks.length,
        uniqueArtists: uniqueArtists.size,
        discoveryArtists: Math.min(discoveryArtists.length, allHistoricalArtists.size),
        streakDays,
        weekTracks,
      });
    } catch (fetchError) {
      console.error('Failed to fetch listening goals summary:', fetchError);
      setError('Could not load your weekly progress right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      fetchProgress();
    }
  }, [fetchProgress, username]);

  const progressCards = useMemo(
    () => [
      {
        title: 'Weekly scrobbles',
        current: weekSummary.scrobbles,
        target: goals.weeklyScrobbles,
        helper: 'Tracks played in the last 7 days',
      },
      {
        title: 'Unique artists',
        current: weekSummary.uniqueArtists,
        target: goals.weeklyArtists,
        helper: 'Distinct artists listened this week',
      },
      {
        title: 'Discovery artists',
        current: weekSummary.discoveryArtists,
        target: goals.weeklyDiscovery,
        helper: 'Artists with 2 or fewer plays in your fetched history',
      },
    ],
    [goals.weeklyArtists, goals.weeklyDiscovery, goals.weeklyScrobbles, weekSummary],
  );

  const completionPercent = useMemo(() => {
    if (progressCards.length === 0) {
      return 0;
    }

    const total = progressCards.reduce((sum, card) => sum + Math.min(card.current / Math.max(card.target, 1), 1), 0);
    return Math.round((total / progressCards.length) * 100);
  }, [progressCards]);

  const saveGoals = () => {
    const sanitizedGoals = {
      weeklyScrobbles: Math.max(1, Number(draftGoals.weeklyScrobbles) || defaultGoals.weeklyScrobbles),
      weeklyArtists: Math.max(1, Number(draftGoals.weeklyArtists) || defaultGoals.weeklyArtists),
      weeklyDiscovery: Math.max(1, Number(draftGoals.weeklyDiscovery) || defaultGoals.weeklyDiscovery),
    };

    setGoals(sanitizedGoals);
    setDraftGoals(sanitizedGoals);
    localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(sanitizedGoals));
    setIsEditing(false);
  };

  const exportGoalsSnapshot = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      username,
      goals,
      progress: weekSummary,
      completionPercent,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });

    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = `${username || 'listener'}-goals-snapshot.json`;
    anchor.click();
    URL.revokeObjectURL(blobUrl);
  };

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Listening Goals</h1>
              <p className="text-gray-400">Build weekly habits and track your momentum in one place.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={fetchProgress}
                className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
              <button
                type="button"
                onClick={exportGoalsSnapshot}
                className="inline-flex items-center gap-2 rounded-md border border-purple-500/60 bg-purple-500/10 px-3 py-2 text-sm text-purple-200 hover:bg-purple-500/20"
              >
                <Download className="h-4 w-4" />
                Export snapshot
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-md border border-red-700 bg-red-900/40 px-4 py-3 text-red-200">{error}</p>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <InfoCard label="Goal completion" value={`${completionPercent}%`} Icon={CheckCircle2} highlight />
            <InfoCard label="Current streak" value={`${weekSummary.streakDays} days`} Icon={CalendarClock} />
            <InfoCard label="7-day plays" value={weekSummary.scrobbles} Icon={CircleDot} />
            <InfoCard label="Distinct artists" value={weekSummary.uniqueArtists} Icon={CircleDot} />
          </div>
        </section>

        <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Weekly targets</h2>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600"
              >
                <PencilLine className="h-4 w-4" />
                Edit targets
              </button>
            ) : (
              <button
                type="button"
                onClick={saveGoals}
                className="inline-flex items-center gap-2 rounded-md border border-green-500/60 bg-green-500/10 px-3 py-2 text-sm text-green-200 hover:bg-green-500/20"
              >
                <Save className="h-4 w-4" />
                Save targets
              </button>
            )}
          </div>

          <div className="space-y-4">
            {progressCards.map((card) => (
              <GoalProgressCard
                key={card.title}
                card={card}
                editable={isEditing}
                draftGoals={draftGoals}
                onChange={setDraftGoals}
              />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <h2 className="mb-4 text-xl font-semibold">Recent listening log (7 days)</h2>
          {weekSummary.weekTracks.length === 0 ? (
            <p className="text-gray-400">No scrobbles were found in the last 7 days.</p>
          ) : (
            <div className="space-y-3">
              {weekSummary.weekTracks.slice(0, 15).map((track, index) => {
                const artist = track.artist?.['#text'] || track.artist?.name || 'Unknown artist';
                const timestamp = track?.date?.uts ? new Date(Number(track.date.uts) * 1000) : null;

                return (
                  <div
                    key={`${track.name}-${artist}-${track?.date?.uts || track.url || index}`}
                    className="rounded-md border border-gray-700 bg-gray-700/60 px-4 py-3"
                  >
                    <p className="font-medium text-white">{track.name}</p>
                    <p className="text-sm text-gray-300">{artist}</p>
                    <p className="text-xs text-gray-400">
                      {timestamp ? timestamp.toLocaleString() : 'Now playing'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const calculateStreakDays = (weekTracks) => {
  const today = new Date();
  const daySet = new Set(
    weekTracks.map((track) => {
      const uts = Number(track?.date?.uts || 0);
      const date = new Date(uts * 1000);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }),
  );

  let streak = 0;

  for (let i = 0; i < 7; i += 1) {
    const inspectedDate = new Date(today);
    inspectedDate.setDate(today.getDate() - i);
    const key = `${inspectedDate.getFullYear()}-${inspectedDate.getMonth()}-${inspectedDate.getDate()}`;

    if (daySet.has(key)) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

const InfoCard = ({ label, value, Icon, highlight = false }) => (
  <article
    className={`rounded-lg border px-4 py-3 ${
      highlight
        ? 'border-purple-500/60 bg-purple-500/10 text-purple-100'
        : 'border-gray-700 bg-gray-700/40 text-gray-100'
    }`}
  >
    <div className="mb-2 flex items-center gap-2 text-sm text-gray-300">
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{label}</span>
    </div>
    <p className="text-xl font-semibold">{value}</p>
  </article>
);

const goalFieldMap = {
  'Weekly scrobbles': 'weeklyScrobbles',
  'Unique artists': 'weeklyArtists',
  'Discovery artists': 'weeklyDiscovery',
};

const GoalProgressCard = ({ card, editable, draftGoals, onChange }) => {
  const field = goalFieldMap[card.title];
  const target = Math.max(1, card.target || 1);
  const ratio = Math.min(card.current / target, 1);

  return (
    <article className="rounded-lg border border-gray-700 bg-gray-700/50 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-white">{card.title}</p>
          <p className="text-sm text-gray-400">{card.helper}</p>
        </div>

        {editable ? (
          <input
            type="number"
            min="1"
            value={draftGoals[field]}
            onChange={(event) =>
              onChange((prev) => ({
                ...prev,
                [field]: Number(event.target.value),
              }))
            }
            className="w-24 rounded-md border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
          />
        ) : (
          <p className="text-sm text-gray-300">
            {card.current} / {card.target}
          </p>
        )}
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-800">
        <div className="h-full rounded-full bg-purple-500" style={{ width: `${ratio * 100}%` }} />
      </div>
    </article>
  );
};

export default ListeningGoals;
