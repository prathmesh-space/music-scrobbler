import { useState, useEffect } from 'react';
import { getRecentTracks, getTopArtists } from '../services/lastfm';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Loader2, Music, Calendar, TrendingUp } from 'lucide-react';
import ListeningCalendar from '../components/Heatmap/ListeningCalender';

const Statistics = ({ username }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScrobbles: 0,
    topGenres: [],
    dailyScrobbles: [],
    topArtists: [],
  });

  const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  useEffect(() => {
    fetchStatistics();
  }, [username]);

  const fetchStatistics = async () => {
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
        topArtists: artists.slice(0, 10).map((artist, index) => ({
          name: artist.name,
          plays: parseInt(artist.playcount),
        })),
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

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
        if (dailyMap.hasOwnProperty(dateStr)) {
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
    // Simulated genre extraction (Last.fm doesn't provide genres directly in top artists)
    // You can enhance this by calling artist.getTopTags for each artist
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Statistics Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3 mb-2">
              <Music className="w-6 h-6 text-purple-400" />
              <span className="text-gray-400">Total Scrobbles (Last 200)</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.totalScrobbles.toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              <span className="text-gray-400">Avg. Daily (Last 7 Days)</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {Math.round(
                stats.dailyScrobbles.reduce((sum, day) => sum + day.scrobbles, 0) / 7
              )}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <span className="text-gray-400">Top Genre</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.topGenres[0]?.name || 'N/A'}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Scrobbles Line Chart */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Daily Scrobbles (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyScrobbles}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="scrobbles" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Genre Distribution Pie Chart */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Genre Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.topGenres}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.topGenres.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Artists Bar Chart */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4">Top 10 Artists (This Month)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topArtists}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="plays" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-8">
          <ListeningCalendar username={username} />
        </div>
      </div>
    </div>
  );
};

export default Statistics;