import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Download, Loader2, PartyPopper } from 'lucide-react';
import { getRecentTracks } from '../services/lastfm';
import { getCachedData, setCachedData } from '../utils/cache';

const GOAL_STORAGE_KEY = 'music-scrobbler-goals';

const defaultGoals = { weeklyScrobbles: 120, weeklyArtists: 35, weeklyDiscovery: 20 };

const getStoredGoals = () => {
  try {
    return { ...defaultGoals, ...(JSON.parse(localStorage.getItem(GOAL_STORAGE_KEY) || '{}') || {}) };
  } catch {
    return defaultGoals;
  }
};

const calculateStreakDays = (weekTracks) => {
  const today = new Date();
  const daySet = new Set(weekTracks.map((track) => {
    const uts = Number(track?.date?.uts || 0);
    const date = new Date(uts * 1000);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }));

  let streak = 0;
  for (let i = 0; i < 7; i += 1) {
    const inspectedDate = new Date(today);
    inspectedDate.setDate(today.getDate() - i);
    const key = `${inspectedDate.getFullYear()}-${inspectedDate.getMonth()}-${inspectedDate.getDate()}`;
    if (daySet.has(key)) streak += 1;
    else break;
  }
  return streak;
};

const ListeningGoals = ({ username }) => {
  const [goals, setGoals] = useState(getStoredGoals);
  const [draft, setDraft] = useState(getStoredGoals);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await getRecentTracks(username, 200);
        const normalized = response?.track || [];
        setTracks(normalized);
        setCachedData(`goals:${username}`, normalized);
      } catch {
        const cached = getCachedData(`goals:${username}`) || [];
        setTracks(Array.isArray(cached) ? cached : []);
      } finally {
        setLoading(false);
      }
    };

    if (username) load();
  }, [username]);

  const summary = useMemo(() => {
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekTracks = tracks.filter((track) => Number(track?.date?.uts || 0) * 1000 >= since);
    const uniqueArtists = new Set(weekTracks.map((t) => t.artist?.['#text'] || t.artist?.name || '').filter(Boolean)).size;
    const discoveries = new Set(weekTracks.map((t) => `${t.name}::${t.artist?.['#text'] || t.artist?.name || ''}`)).size;
    return {
      weekTracks,
      scrobbles: weekTracks.length,
      uniqueArtists,
      discovery: discoveries,
      streak: calculateStreakDays(weekTracks),
    };
  }, [tracks]);

  const completionPercent = Math.min(100, Math.round(((summary.scrobbles / goals.weeklyScrobbles) * 100 + (summary.uniqueArtists / goals.weeklyArtists) * 100 + (summary.discovery / goals.weeklyDiscovery) * 100) / 3));
  const milestoneBadges = [
    { label: 'Streak Starter', unlocked: summary.streak >= 3 },
    { label: 'Momentum Maker', unlocked: summary.streak >= 5 },
    { label: '7-Day Champion', unlocked: summary.streak >= 7 },
    { label: 'Goal Crusher', unlocked: completionPercent >= 100 },
  ];

  const celebrate = completionPercent >= 100;

  const saveGoals = () => {
    localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(draft));
    setGoals(draft);
  };

  const exportCsv = () => {
    const rows = [['Metric', 'Value'], ['Weekly Scrobbles', summary.scrobbles], ['Unique Artists', summary.uniqueArtists], ['Discovery Tracks', summary.discovery], ['Streak Days', summary.streak], ['Completion %', completionPercent]];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${username || 'listener'}-goals.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="page-shell page-shell--center page-shell--text"><Loader2 className="h-10 w-10 animate-spin text-purple-400" /></div>;

  return (
    <div className="page-shell page-shell--text">
      <div className="page-container">
        {celebrate ? <div className="pointer-events-none fixed inset-x-0 top-20 z-40 text-center text-4xl animate-bounce">🎉 🎶 🥳 🎉</div> : null}

        <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">Listening Goals</h1>
              <p className="text-gray-400">Track streaks, unlock milestone badges, and celebrate consistency.</p>
            </div>
            <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-md border border-purple-500/60 bg-purple-500/10 px-3 py-2 text-sm text-purple-200 hover:bg-purple-500/20">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <InfoCard label="Goal completion" value={`${completionPercent}%`} Icon={CheckCircle2} highlight />
            <InfoCard label="Current streak" value={`${summary.streak} days`} Icon={CalendarClock} />
            <InfoCard label="7-day plays" value={summary.scrobbles} Icon={PartyPopper} />
            <InfoCard label="Distinct artists" value={summary.uniqueArtists} Icon={PartyPopper} />
          </div>
        </section>

        <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <h2 className="mb-3 text-xl font-semibold">Milestone badges</h2>
          <div className="flex flex-wrap gap-2">
            {milestoneBadges.map((badge) => (
              <span key={badge.label} className={`rounded-full border px-3 py-1 text-sm ${badge.unlocked ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100' : 'border-gray-600 bg-gray-700 text-gray-300'}`}>
                {badge.unlocked ? '🏅' : '🔒'} {badge.label}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <h2 className="mb-4 text-xl font-semibold">Weekly targets</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <GoalInput label="Scrobbles" value={draft.weeklyScrobbles} onChange={(value) => setDraft((prev) => ({ ...prev, weeklyScrobbles: value }))} />
            <GoalInput label="Artists" value={draft.weeklyArtists} onChange={(value) => setDraft((prev) => ({ ...prev, weeklyArtists: value }))} />
            <GoalInput label="Discovery" value={draft.weeklyDiscovery} onChange={(value) => setDraft((prev) => ({ ...prev, weeklyDiscovery: value }))} />
          </div>
          <button type="button" onClick={saveGoals} className="mt-4 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-500">Save targets</button>
        </section>
      </div>
    </div>
  );
};

const GoalInput = ({ label, value, onChange }) => (
  <label className="space-y-1">
    <span className="text-sm text-gray-300">{label}</span>
    <input type="number" min="1" value={value} onChange={(event) => onChange(Number(event.target.value) || 1)} className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2" />
  </label>
);

const InfoCard = ({ label, value, highlight = false }) => (
  <div className={`rounded-lg border px-4 py-3 ${highlight ? 'border-purple-500/60 bg-purple-500/10' : 'border-gray-700 bg-gray-700/40'}`}>
    <div className="mb-2 flex items-center gap-2 text-sm text-gray-300">{label}</div>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default ListeningGoals;
