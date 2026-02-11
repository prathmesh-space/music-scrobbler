import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Calendar, Clock3, Loader2, Music, TrendingUp } from 'lucide-react';
import { getRecentTracks, getTopArtists } from '../services/lastfm';
import ListeningCalendar from '../components/Heatmap/ListeningCalender';

const RANGE_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

const WEEKDAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CHART_COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#22d3ee'];

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const toTrackTimestamp = (track) => {
  if (!track?.date?.uts) return null;
  const parsed = Number.parseInt(track.date.uts, 10);
  return Number.isNaN(parsed) ? null : parsed * 1000;
};

const formatHourLabel = (hour) => `${hour.toString().padStart(2, '0')}:00`;

const Statistics = ({ username }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangeDays, setRangeDays] = useState(14);
  const [recentTracks, setRecentTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);

  const fetchStatistics = useCallback(async () => {
    if (!username) return;

    setLoading(true);
    setError('');

    try {
      const [recentData, artistsData] = await Promise.all([
        getRecentTracks(username, 500),
        getTopArtists(username, '1month', 12),
      ]);

      const tracks = Array.isArray(recentData?.track) ? recentData.track : [];
      const artists = Array.isArray(artistsData?.artist) ? artistsData.artist : [];

      setRecentTracks(tracks);
      setTopArtists(artists.slice(0, 10).map((artist) => ({
        name: artist.name,
        plays: Number.parseInt(artist.playcount, 10) || 0,
      })));
    } catch (fetchError) {
      console.error('Error fetching statistics:', fetchError);
      setError('Could not load statistics right now. Please try again in a moment.');
      setRecentTracks([]);
      setTopArtists([]);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const computed = useMemo(() => {
    const now = new Date();
    const periodStart = startOfDay(new Date(now.getTime() - (rangeDays - 1) * 24 * 60 * 60 * 1000));

    const trackEvents = recentTracks
      .map((track) => {
        const timestamp = toTrackTimestamp(track);
        if (!timestamp) return null;

        return {
          timestamp,
          date: new Date(timestamp),
          artist: track.artist?.['#text'] || track.artist?.name || 'Unknown artist',
          title: track.name,
        };
      })
      .filter(Boolean)
      .filter((event) => event.date >= periodStart && event.date <= now);

    const dailyMap = new Map();

    for (let index = 0; index < rangeDays; index += 1) {
      const day = startOfDay(new Date(periodStart.getTime() + index * 24 * 60 * 60 * 1000));
      const key = day.toISOString().slice(0, 10);
      dailyMap.set(key, {
        isoDate: key,
        label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        shortLabel: day.toLocaleDateString('en-US', { weekday: 'short' }),
        scrobbles: 0,
      });
    }

    const hourlyMap = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: formatHourLabel(hour),
      plays: 0,
    }));

    const weekdayMap = WEEKDAY_ORDER.reduce((accumulator, weekday) => {
      accumulator[weekday] = 0;
      return accumulator;
    }, {});

    trackEvents.forEach((event) => {
      const key = startOfDay(event.date).toISOString().slice(0, 10);
      const existing = dailyMap.get(key);

      if (existing) {
        existing.scrobbles += 1;
      }

      const hour = event.date.getHours();
      hourlyMap[hour].plays += 1;

      const weekday = WEEKDAY_ORDER[event.date.getDay()];
      weekdayMap[weekday] += 1;
    });

    const dailyScrobbles = Array.from(dailyMap.values());
    const weekdayScrobbles = WEEKDAY_ORDER.map((day) => ({
      day,
      plays: weekdayMap[day],
    }));

    const totalScrobbles = trackEvents.length;
    const activeDays = dailyScrobbles.filter((day) => day.scrobbles > 0).length;
    const averageDaily = rangeDays ? totalScrobbles / rangeDays : 0;
    const peakDay = dailyScrobbles.reduce(
      (current, day) => (day.scrobbles > current.scrobbles ? day : current),
      { label: '-', scrobbles: 0 },
    );
    const topHour = hourlyMap.reduce(
      (current, hour) => (hour.plays > current.plays ? hour : current),
      { hour: 0, plays: 0, label: '00:00' },
    );

    return {
      totalScrobbles,
      averageDaily,
      activeDays,
      peakDay,
      topHour,
      dailyScrobbles,
      hourlyScrobbles: hourlyMap,
      weekdayScrobbles,
    };
  }, [rangeDays, recentTracks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Statistics Dashboard</h1>
              <p className="mt-1 text-sm text-gray-400">
                Explore your listening behavior by day, weekday, and hour.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRangeDays(option.value)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    rangeDays === option.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Last {option.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-md border border-red-700 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p>
          ) : null}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Scrobbles in range" value={computed.totalScrobbles.toLocaleString()} icon={<Music className="h-4 w-4 text-purple-300" />} />
          <StatCard label="Average per day" value={computed.averageDaily.toFixed(1)} icon={<Calendar className="h-4 w-4 text-purple-300" />} />
          <StatCard label="Active days" value={`${computed.activeDays}/${rangeDays}`} icon={<TrendingUp className="h-4 w-4 text-purple-300" />} />
          <StatCard label="Peak hour" value={`${computed.topHour.label} (${computed.topHour.plays})`} icon={<Clock3 className="h-4 w-4 text-purple-300" />} />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <article className="rounded-xl border border-gray-700 bg-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white">Daily scrobbles</h2>
            <p className="mb-4 text-sm text-gray-400">
              Peak day: <span className="text-purple-300">{computed.peakDay.label}</span> with{' '}
              <span className="text-white font-semibold">{computed.peakDay.scrobbles}</span> plays.
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={computed.dailyScrobbles}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="label" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
                <Line type="monotone" dataKey="scrobbles" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </article>

          <article className="rounded-xl border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Listening by hour</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={computed.hourlyScrobbles}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" tickFormatter={(value) => `${value}`} />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                  formatter={(value) => [value, 'Plays']}
                  labelFormatter={(value) => `${formatHourLabel(value)} hour`}
                />
                <Bar dataKey="plays" radius={[4, 4, 0, 0]}>
                  {computed.hourlyScrobbles.map((entry, index) => (
                    <Cell
                      key={`hour-${entry.hour}`}
                      fill={entry.plays === computed.topHour.plays && entry.plays > 0 ? '#a78bfa' : CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="rounded-xl border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Weekday distribution</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={computed.weekdayScrobbles}
                  dataKey="plays"
                  nameKey="day"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label={(entry) => `${entry.day} (${entry.plays})`}
                >
                  {computed.weekdayScrobbles.map((entry, index) => (
                    <Cell key={`weekday-${entry.day}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
              </PieChart>
            </ResponsiveContainer>
          </article>

          <article className="rounded-xl border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Top artists (last month)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topArtists} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis type="category" width={120} dataKey="name" stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
                <Bar dataKey="plays" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>
        </section>

        <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Listening Calendar</h2>
          <ListeningCalendar username={username} />
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon }) => (
  <article className="rounded-lg border border-gray-700 bg-gray-800 p-4">
    <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
      {icon}
      <span>{label}</span>
    </div>
    <p className="text-2xl font-semibold text-white">{value}</p>
  </article>
);

export default Statistics;
