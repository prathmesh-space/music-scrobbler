import { useEffect, useState, useCallback } from 'react';
import { Loader2, TrendingUp, Music, Clock, Calendar } from 'lucide-react';

/**
 * Statistics Sidebar Component
 * Displays user listening statistics in a compact sidebar format
 */
export default function StatisticsSidebar({ username, timePeriod = '7day' }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching stats - replace with your actual API call
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Replace with actual API call
        // const data = await getUserStats(username, timePeriod);
        
        // Mock data for demonstration
        await new Promise(resolve => setTimeout(resolve, 500));
        setStats({
          totalPlays: 1247,
          totalArtists: 89,
          totalTracks: 456,
          listeningTime: 42.5, // hours
          topGenre: 'Rock',
          avgPlaysPerDay: 178,
          streak: 12, // days
          newArtists: 8,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchStats();
    }
  }, [username, timePeriod]);

  if (loading) {
    return (
      <aside className="sticky top-24 h-fit rounded-[30px] bg-white/60 backdrop-blur-sm p-6 shadow-lg ring-1 ring-[#CFD0B9]/30">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#6B5A2A]" />
          <p className="mt-3 font-['Inter'] text-sm text-[#6B5A2A]">Loading stats...</p>
        </div>
      </aside>
    );
  }

  if (!stats) {
    return null;
  }

  const getPeriodLabel = (period) => {
    const labels = {
      '7day': 'Last 7 days',
      '1month': 'Last month',
      '3month': 'Last 3 months',
      '6month': 'Last 6 months',
      '12month': 'Last year',
      'overall': 'All time',
    };
    return labels[period] || 'This period';
  };

  const getFunFact = () => {
    const facts = [
      `You've discovered ${stats.newArtists} new artists this period!`,
      `That's enough music to soundtrack ${Math.round(stats.listeningTime / 2)} movies!`,
      `You've listened to ${stats.totalTracks} different tracks!`,
      `Your top genre is ${stats.topGenre} - great taste!`,
      `You're averaging ${stats.avgPlaysPerDay} plays per day!`,
    ];
    
    return facts[Math.floor(Math.random() * facts.length)];
  };

  return (
    <aside className="sticky top-24 h-fit space-y-4">
      {/* Header */}
      <div className="rounded-[30px] bg-white/70 backdrop-blur-sm p-6 shadow-lg ring-1 ring-[#CFD0B9]/30">
        <h2 className="mb-2 font-['Amiri_Quran'] text-3xl font-normal text-[#3E3D1A]">
          Your Stats
        </h2>
        <p className="font-['Inter_Display'] text-sm font-light text-[#6B5A2A]">
          {getPeriodLabel(timePeriod)}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="space-y-3">
        {/* Total Plays */}
        <div className="rounded-[25px] bg-gradient-to-br from-[#EECEA4]/40 to-[#FFE5D9]/30 p-5 backdrop-blur-sm shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-['Inter'] text-xs font-medium uppercase tracking-wide text-[#3E3D1A]/70">
              Total Plays
            </p>
            <Music className="h-4 w-4 text-[#3E3D1A]/60" />
          </div>
          <p className="font-['Inter'] text-3xl font-bold text-[#3E3D1A]">
            {stats.totalPlays.toLocaleString()}
          </p>
          <p className="mt-1 font-['Inter'] text-xs font-light text-[#3E3D1A]/60">
            ~{stats.avgPlaysPerDay} per day
          </p>
        </div>

        {/* Listening Time */}
        <div className="rounded-[25px] bg-gradient-to-br from-[#E0F5F0]/50 to-[#C8E6D7]/30 p-5 backdrop-blur-sm shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-['Inter'] text-xs font-medium uppercase tracking-wide text-[#3E3D1A]/70">
              Listening Time
            </p>
            <Clock className="h-4 w-4 text-[#3E3D1A]/60" />
          </div>
          <p className="font-['Inter'] text-3xl font-bold text-[#3E3D1A]">
            {stats.listeningTime}h
          </p>
          <p className="mt-1 font-['Inter'] text-xs font-light text-[#3E3D1A]/60">
            {Math.round(stats.listeningTime / 7)} hours per day
          </p>
        </div>

        {/* Artists & Tracks */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[20px] bg-white/80 backdrop-blur-sm p-4 shadow-md ring-1 ring-[#CFD0B9]/20">
            <p className="mb-1 font-['Inter'] text-xs font-medium uppercase tracking-wide text-[#3E3D1A]/70">
              Artists
            </p>
            <p className="font-['Inter'] text-2xl font-bold text-[#3E3D1A]">
              {stats.totalArtists}
            </p>
            {stats.newArtists > 0 && (
              <p className="mt-1 font-['Inter'] text-xs font-light text-[#6B5A2A]">
                +{stats.newArtists} new
              </p>
            )}
          </div>

          <div className="rounded-[20px] bg-white/80 backdrop-blur-sm p-4 shadow-md ring-1 ring-[#CFD0B9]/20">
            <p className="mb-1 font-['Inter'] text-xs font-medium uppercase tracking-wide text-[#3E3D1A]/70">
              Tracks
            </p>
            <p className="font-['Inter'] text-2xl font-bold text-[#3E3D1A]">
              {stats.totalTracks}
            </p>
          </div>
        </div>

        {/* Top Genre */}
        <div className="rounded-[25px] bg-gradient-to-br from-[#E8E0F5]/50 to-[#CFD0B9]/20 p-5 backdrop-blur-sm shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-['Inter'] text-xs font-medium uppercase tracking-wide text-[#3E3D1A]/70">
              Top Genre
            </p>
            <TrendingUp className="h-4 w-4 text-[#3E3D1A]/60" />
          </div>
          <p className="font-['Inter'] text-2xl font-bold text-[#3E3D1A]">
            {stats.topGenre}
          </p>
        </div>

        {/* Streak */}
        {stats.streak > 0 && (
          <div className="rounded-[25px] bg-gradient-to-br from-[#FFE5D9]/40 to-[#EECEA4]/30 p-5 backdrop-blur-sm shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-['Inter'] text-xs font-medium uppercase tracking-wide text-[#3E3D1A]/70">
                Listening Streak
              </p>
              <Calendar className="h-4 w-4 text-[#3E3D1A]/60" />
            </div>
            <p className="font-['Inter'] text-3xl font-bold text-[#3E3D1A]">
              {stats.streak}
            </p>
            <p className="mt-1 font-['Inter'] text-xs font-light text-[#3E3D1A]/60">
              days in a row 🔥
            </p>
          </div>
        )}
      </div>

      {/* Fun Fact */}
      <div className="rounded-[25px] bg-white/60 backdrop-blur-sm p-5 shadow-md ring-1 ring-[#CFD0B9]/20">
        <p className="mb-2 font-['Inter'] text-xs font-semibold uppercase tracking-wide text-[#3E3D1A]/70">
          Did you know?
        </p>
        <p className="font-['Inter'] text-sm leading-relaxed text-[#3E3D1A]">
          {getFunFact()}
        </p>
      </div>
    </aside>
  );
}