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
import { Calendar, Clock3, Hash, Loader2, MoreVertical, Music, TrendingUp } from 'lucide-react';
import { getArtistTopTags, getRecentTracks, getTopArtists } from '../services/lastfm';
import ListeningCalendar from '../components/Heatmap/ListeningCalender';

const RANGE_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

const WEEKDAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CHART_COLORS = ['#FFB7C5', '#D5F3D8', '#F2C7C7', '#EAA9BA', '#BEEBC5', '#F7D7DE', '#C9EFD0'];

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
  const [tagCloud, setTagCloud] = useState([]);

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

      const trimmedArtists = artists.slice(0, 10).map((artist) => ({
        name: artist.name,
        plays: Number.parseInt(artist.playcount, 10) || 0,
      }));

      setRecentTracks(tracks);
      setTopArtists(trimmedArtists);

      const topTagsByArtist = await Promise.allSettled(
        trimmedArtists.slice(0, 8).map(async (artist) => {
          const tagsData = await getArtistTopTags(artist.name, 8);
          const tags = Array.isArray(tagsData?.tag) ? tagsData.tag : [];

          return {
            artistPlays: artist.plays,
            tags,
          };
        }),
      );

      const tagScores = new Map();

      topTagsByArtist.forEach((result) => {
        if (result.status !== 'fulfilled') return;

        const { artistPlays, tags } = result.value;

        tags.forEach((tag) => {
          const tagName = typeof tag?.name === 'string' ? tag.name.trim() : '';
          const tagCount = Number.parseInt(tag?.count, 10) || 0;

          if (!tagName || tagCount <= 0) return;

          const score = tagCount * Math.max(artistPlays, 1);
          const previous = tagScores.get(tagName) || 0;
          tagScores.set(tagName, previous + score);
        });
      });

      const sortedTags = Array.from(tagScores.entries())
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 24);

      setTagCloud(sortedTags);
    } catch (fetchError) {
      console.error('Error fetching statistics:', fetchError);
      setError('Could not load statistics right now. Please try again in a moment.');
      setRecentTracks([]);
      setTopArtists([]);
      setTagCloud([]);
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

  const cloudTags = useMemo(() => {
    if (!tagCloud.length) return [];

    const scores = tagCloud.map((tag) => tag.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const scoreRange = Math.max(maxScore - minScore, 1);

    return tagCloud.map((tag, index) => {
      const normalized = (tag.score - minScore) / scoreRange;
      const fontSize = 18 + normalized * 44;
      const opacity = 0.7 + normalized * 0.3;
      const rotate = index % 7 === 0 ? -4 : index % 5 === 0 ? 4 : 0;

      return {
        ...tag,
        style: {
          fontSize: `${fontSize}px`,
          opacity,
          transform: `rotate(${rotate}deg)`,
        },
      };
    });
  }, [tagCloud]);

  if (loading) {
    return (
      <div className="page-shell page-shell--center">
        <Loader2 className="w-12 h-12 text-[#FFB7C5] animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-shell text-[#4A3E3E]" style={{ fontFamily: "Krub, sans-serif" }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="rounded-2xl border border-[#FFB7C5]/40 bg-[#FFFFFF] p-6 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#4A3E3E]" style={{ fontFamily: "Inter, sans-serif" }}>Statistics Dashboard</h1>
              <p className="mt-1 text-sm text-[#7A6666]">
                Explore your listening behavior by day, weekday, and hour.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRangeDays(option.value)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition shadow-sm ${
                    rangeDays === option.value
                      ? 'bg-[#FFB7C5] text-[#4A3E3E]'
                      : 'bg-[#F2C7C7]/40 text-[#7A6666] hover:bg-[#F2C7C7]/70'
                  }`}
                >
                  Last {option.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-[#FFB7C5]/70 bg-[#F2C7C7]/40 px-4 py-3 text-sm text-[#7A4B56]">{error}</p>
          ) : null}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Scrobbles in range" value={computed.totalScrobbles.toLocaleString()} icon={<Music className="h-4 w-4 text-[#FFB7C5]" />} />
          <StatCard label="Average per day" value={computed.averageDaily.toFixed(1)} icon={<Calendar className="h-4 w-4 text-[#FFB7C5]" />} />
          <StatCard label="Active days" value={`${computed.activeDays}/${rangeDays}`} icon={<TrendingUp className="h-4 w-4 text-[#FFB7C5]" />} />
          <StatCard label="Peak hour" value={`${computed.topHour.label} (${computed.topHour.plays})`} icon={<Clock3 className="h-4 w-4 text-[#FFB7C5]" />} />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-[#FFB7C5]/40 bg-[#FFFFFF] p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-[#4A3E3E]" style={{ fontFamily: "Inter, sans-serif" }}>Daily scrobbles</h2>
            <p className="mb-4 text-sm text-[#7A6666]">
              Peak day: <span className="font-semibold text-[#E28EA0]">{computed.peakDay.label}</span> with{' '}
              <span className="font-semibold text-[#4A3E3E]">{computed.peakDay.scrobbles}</span> plays.
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={computed.dailyScrobbles}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2C7C7" />
                <XAxis dataKey="label" stroke="#9D8686" />
                <YAxis stroke="#9D8686" />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #F2C7C7', borderRadius: '10px' }} />
                <Line type="monotone" dataKey="scrobbles" stroke="#FFB7C5" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </article>

          <article className="rounded-2xl border border-[#D5F3D8] bg-[#FFFFFF] p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-[#4A3E3E]" style={{ fontFamily: "Inter, sans-serif" }}>Listening by hour</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={computed.hourlyScrobbles}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D5F3D8" />
                <XAxis dataKey="hour" stroke="#7A9181" tickFormatter={(value) => `${value}`} />
                <YAxis stroke="#7A9181" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D5F3D8', borderRadius: '10px' }}
                  formatter={(value) => [value, 'Plays']}
                  labelFormatter={(value) => `${formatHourLabel(value)} hour`}
                />
                <Bar dataKey="plays" radius={[4, 4, 0, 0]}>
                  {computed.hourlyScrobbles.map((entry, index) => (
                    <Cell
                      key={`hour-${entry.hour}`}
                      fill={entry.plays === computed.topHour.plays && entry.plays > 0 ? '#FFB7C5' : CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="rounded-2xl border border-[#F2C7C7]/50 bg-[#FFFFFF] p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-[#4A3E3E]" style={{ fontFamily: "Inter, sans-serif" }}>Weekday distribution</h2>
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
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #F2C7C7', borderRadius: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </article>

          <article className="rounded-2xl border border-[#D5F3D8] bg-[#FFFFFF] p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-[#4A3E3E]" style={{ fontFamily: "Inter, sans-serif" }}>Top artists (last month)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topArtists} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D5F3D8" />
                <XAxis type="number" stroke="#7A9181" />
                <YAxis type="category" width={120} dataKey="name" stroke="#7A9181" />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D5F3D8', borderRadius: '10px' }} />
                <Bar dataKey="plays" fill="#D5F3D8" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>
        </section>

        <section className="rounded-2xl border border-[#FFB7C5]/40 bg-[#FFFFFF] p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-[#4A3E3E]" style={{ fontFamily: "Inter, sans-serif" }}>Listening Calendar</h2>
          <ListeningCalendar username={username} />
        </section>

        <section className="rounded-2xl border border-[#F2C7C7]/60 bg-[#FFFFFF] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-[#FFB7C5]" />
              <h2 className="text-lg font-semibold text-[#4A3E3E]" style={{ fontFamily: "Inter, sans-serif" }}>Tag cloud</h2>
            </div>
            <MoreVertical className="h-5 w-5 text-[#FFB7C5]" />
          </div>

          {cloudTags.length ? (
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-3 py-4 text-[#A56C78]">
              {cloudTags.map((tag) => (
                <span key={tag.name} className="leading-none transition-transform duration-200 hover:scale-105" style={tag.style}>
                  {tag.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[#7A6666]">No genre tags were available for your top artists in this period.</p>
          )}

          <p className="mt-2 text-center text-sm text-[#7A6666]">Based on Artists (Last.fm)</p>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon }) => (
  <article className="rounded-2xl border border-[#F2C7C7]/50 bg-[#FFFFFF] p-4 shadow-md">
    <div className="mb-2 flex items-center gap-2 text-sm text-[#7A6666]">
      {icon}
      <span>{label}</span>
    </div>
    <p className="text-2xl font-semibold text-[#4A3E3E]" style={{ fontFamily: "Inter, sans-serif" }}>{value}</p>
  </article>
);

export default Statistics;
