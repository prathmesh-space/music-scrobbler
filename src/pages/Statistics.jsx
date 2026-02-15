import { useState, useEffect, useCallback } from 'react';
import { getRecentTracks, getTopArtists } from '../services/lastfm';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Loader2, Music, Calendar, TrendingUp, Users, Clock, Headphones } from 'lucide-react';
import ListeningCalendar from '../components/Heatmap/ListeningCalender';

const Statistics = ({ username, embedded = false }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScrobbles: 0,
    topGenres: [],
    dailyScrobbles: [],
    topArtists: [],
  });

  // Pastoral theme colors
  const COLORS = ['#6B5A2A', '#EECEA4', '#C8E6D7', '#E0F5F0', '#FFE5D9', '#E8E0F5'];

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch recent tracks for the last 7 days
      const recentData = await getRecentTracks(username, 200);
      const tracks = recentData.track || [];

      // Fetch top artists
      const artistsData = await getTopArtists(username, '1month', 10);
      const artists = artistsData.artist || [];

      // Calculate daily scrobbles
      const dailyScrobbles = calculateDailyScrobbles(tracks);

      // Extract genres from top artists
      const genres = extractGenres(artists);

      setStats({
        totalScrobbles: parseInt(recentData['@attr']?.total || 0),
        topGenres: genres,
        dailyScrobbles: dailyScrobbles,
        topArtists: artists.slice(0, 10).map((artist) => ({
          name: artist.name,
          plays: parseInt(artist.playcount),
        })),
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const calculateDailyScrobbles = (tracks) => {
    const dailyMap = {};
    const last7Days = [];
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap[dateStr] = 0;
      last7Days.push(dateStr);
    }

    // Count scrobbles per day
    tracks.forEach(track => {
      if (track.date?.uts) {
        const date = new Date(parseInt(track.date.uts) * 1000);
        const dateStr = date.toISOString().split('T')[0];
        if (Object.prototype.hasOwnProperty.call(dailyMap, dateStr)) {
          dailyMap[dateStr]++;
        }
      }
    });

    // Convert to chart format
    return last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      scrobbles: dailyMap[date],
    }));
  };

  const extractGenres = (artists) => {
    const genreMap = {
      'Rock': 0,
      'Pop': 0,
      'Electronic': 0,
      'Hip-Hop': 0,
      'Indie': 0,
      'Alternative': 0,
    };

    // Randomly assign for demo (in production, fetch real tags)
    artists.forEach(artist => {
      const genres = Object.keys(genreMap);
      const randomGenre = genres[Math.floor(Math.random() * genres.length)];
      genreMap[randomGenre] += parseInt(artist.playcount);
    });

    return Object.entries(genreMap)
      .map(([name, value]) => ({ name, value }))
      .filter(g => g.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center ${embedded ? 'py-20' : 'min-h-screen'}`}
        style={{ background: 'transparent' }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-12 w-12 animate-spin text-[#6B5A2A]" />
          <p className="font-['Inter'] text-lg text-[#3E3D1A]">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${embedded ? '' : 'min-h-screen py-8'} px-4`}
      style={{ background: 'transparent' }}
    >
      <div className="mx-auto max-w-7xl">
        {!embedded && (
          <h1 className="mb-8 font-['Amiri_Quran'] text-6xl font-normal text-[#3E3D1A]">
            Statistics Dashboard
          </h1>
        )}

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Total Scrobbles */}
          <div className="rounded-[25px] bg-gradient-to-br from-[#EECEA4]/40 to-[#FFE5D9]/30 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-full bg-white/50 p-2">
                <Music className="h-5 w-5 text-[#3E3D1A]" />
              </div>
              <span className="font-['Inter'] text-sm font-medium text-[#3E3D1A]/70">
                Total Scrobbles
              </span>
            </div>
            <p className="font-['Inter'] text-4xl font-bold text-[#3E3D1A]">
              {stats.totalScrobbles.toLocaleString()}
            </p>
            <p className="mt-2 font-['Inter'] text-xs font-light text-[#3E3D1A]/60">
              Last 200 tracks
            </p>
          </div>

          {/* Daily Average */}
          <div className="rounded-[25px] bg-gradient-to-br from-[#E0F5F0]/50 to-[#C8E6D7]/30 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-full bg-white/50 p-2">
                <Calendar className="h-5 w-5 text-[#3E3D1A]" />
              </div>
              <span className="font-['Inter'] text-sm font-medium text-[#3E3D1A]/70">
                Daily Average
              </span>
            </div>
            <p className="font-['Inter'] text-4xl font-bold text-[#3E3D1A]">
              {Math.round(
                stats.dailyScrobbles.reduce((sum, day) => sum + day.scrobbles, 0) / 7
              )}
            </p>
            <p className="mt-2 font-['Inter'] text-xs font-light text-[#3E3D1A]/60">
              Last 7 days
            </p>
          </div>

          {/* Top Genre */}
          <div className="rounded-[25px] bg-gradient-to-br from-[#E8E0F5]/50 to-[#CFD0B9]/20 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-full bg-white/50 p-2">
                <TrendingUp className="h-5 w-5 text-[#3E3D1A]" />
              </div>
              <span className="font-['Inter'] text-sm font-medium text-[#3E3D1A]/70">
                Top Genre
              </span>
            </div>
            <p className="font-['Inter'] text-4xl font-bold text-[#3E3D1A]">
              {stats.topGenres[0]?.name || 'N/A'}
            </p>
            <p className="mt-2 font-['Inter'] text-xs font-light text-[#3E3D1A]/60">
              Most listened
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Daily Scrobbles Line Chart */}
          <div className="rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
            <h2 className="mb-4 font-['Amiri_Quran'] text-2xl font-normal text-[#3E3D1A]">
              Daily Scrobbles
            </h2>
            <p className="mb-4 font-['Inter'] text-sm font-light text-[#6B5A2A]">
              Last 7 days
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyScrobbles}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CFD0B9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B5A2A"
                  style={{ fontSize: '12px', fontFamily: 'Inter' }}
                />
                <YAxis 
                  stroke="#6B5A2A"
                  style={{ fontSize: '12px', fontFamily: 'Inter' }}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #CFD0B9',
                    borderRadius: '12px',
                    fontFamily: 'Inter'
                  }}
                  labelStyle={{ color: '#3E3D1A', fontWeight: 600 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="scrobbles" 
                  stroke="#6B5A2A" 
                  strokeWidth={3}
                  dot={{ fill: '#EECEA4', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Genre Distribution Pie Chart */}
          <div className="rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
            <h2 className="mb-4 font-['Amiri_Quran'] text-2xl font-normal text-[#3E3D1A]">
              Genre Distribution
            </h2>
            <p className="mb-4 font-['Inter'] text-sm font-light text-[#6B5A2A]">
              Your music taste
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.topGenres}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.topGenres.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #CFD0B9',
                    borderRadius: '12px',
                    fontFamily: 'Inter'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Artists Bar Chart */}
          <div className="rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30 lg:col-span-2">
            <h2 className="mb-4 font-['Amiri_Quran'] text-2xl font-normal text-[#3E3D1A]">
              Top 10 Artists
            </h2>
            <p className="mb-4 font-['Inter'] text-sm font-light text-[#6B5A2A]">
              This month
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topArtists}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CFD0B9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6B5A2A" 
                  angle={-45} 
                  textAnchor="end" 
                  height={120}
                  style={{ fontSize: '11px', fontFamily: 'Inter' }}
                />
                <YAxis 
                  stroke="#6B5A2A"
                  style={{ fontSize: '12px', fontFamily: 'Inter' }}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #CFD0B9',
                    borderRadius: '12px',
                    fontFamily: 'Inter'
                  }}
                  labelStyle={{ color: '#3E3D1A', fontWeight: 600 }}
                />
                <Bar 
                  dataKey="plays" 
                  fill="#6B5A2A"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Listening Calendar */}
        <div className="space-y-8">
          <div className="rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
            <h2 className="mb-4 font-['Amiri_Quran'] text-2xl font-normal text-[#3E3D1A]">
              Listening Activity
            </h2>
            <p className="mb-6 font-['Inter'] text-sm font-light text-[#6B5A2A]">
              Your listening patterns over time
            </p>
            <ListeningCalendar username={username} embedded />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;