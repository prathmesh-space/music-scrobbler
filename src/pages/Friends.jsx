import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownAZ,
  Clock3,
  Loader2,
  Music2,
  Search,
  UserRound,
} from 'lucide-react';
import { getFriends, getRecentTracks } from '../services/lastfm';
import TasteComparator from '../components/Comparison/TasteComparator';

const Friends = ({ username }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const data = await getFriends(username, 30);
        const friendList = Array.isArray(data?.user) ? data.user : data?.user ? [data.user] : [];

        const friendsWithRecentTracks = await Promise.all(
          friendList.map(async (friend) => {
            try {
              const recent = await getRecentTracks(friend.name, 1);
              const recentTrack = Array.isArray(recent?.track) ? recent.track[0] : recent?.track;

              return {
                ...friend,
                recentTrack,
              };
            } catch (error) {
              console.error(`Error fetching recent track for ${friend.name}:`, error);
              return {
                ...friend,
                recentTrack: null,
              };
            }
          }),
        );

        setFriends(friendsWithRecentTracks);
      } catch (error) {
        console.error('Error fetching friends:', error);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchFriends();
  }, [username]);

  const filteredFriends = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = friends.filter((friend) => {
      if (!query) return true;

      const recentTrack = friend.recentTrack;
      const artistName = recentTrack?.artist?.['#text'] || recentTrack?.artist?.name || '';
      const songName = recentTrack?.name || '';
      const friendName = friend.realname || friend.name;

      return [friendName, friend.name, songName, artistName]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return (a.realname || a.name).localeCompare(b.realname || b.name);
      }

      if (sortBy === 'nowPlaying') {
        const aNowPlaying = a.recentTrack?.['@attr']?.nowplaying === 'true' ? 1 : 0;
        const bNowPlaying = b.recentTrack?.['@attr']?.nowplaying === 'true' ? 1 : 0;
        return bNowPlaying - aNowPlaying;
      }

      const aDate = Number.parseInt(a.recentTrack?.date?.uts || 0, 10);
      const bDate = Number.parseInt(b.recentTrack?.date?.uts || 0, 10);
      return bDate - aDate;
    });

    return sorted;
  }, [friends, searchTerm, sortBy]);

  const summary = useMemo(() => {
    const nowPlayingCount = friends.filter((friend) => friend.recentTrack?.['@attr']?.nowplaying === 'true').length;
    const withRecentTrack = friends.filter((friend) => friend.recentTrack).length;

    return {
      total: friends.length,
      nowPlaying: nowPlayingCount,
      activeRecently: withRecentTrack,
    };
  }, [friends]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-12 w-12 animate-spin text-[#6B5A2A]" />
          <p className="font-['Inter'] text-lg text-[#3E3D1A]">Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ background: 'transparent' }}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-6">
            <h1 className="font-['Amiri_Quran'] text-7xl font-normal text-[#3E3D1A] md:text-8xl">
              Friends
            </h1>
            <p className="mt-3 font-['Inter_Display'] text-lg font-light text-[#2D2D2D] md:text-xl">
              Keep up with your friends' latest scrobbles and compare your taste
            </p>
          </div>

          {/* Search and Sort Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-3 rounded-[25px] border-2 border-[#CFD0B9] bg-white px-6 py-3.5 shadow-md transition-all hover:shadow-lg">
              <Search className="h-5 w-5 text-[#6B5A2A]" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search friends or tracks"
                className="w-56 bg-transparent font-['Inter'] text-base text-[#3E3D1A] placeholder:text-[#6B5A2A]/50 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 rounded-[25px] border-2 border-[#CFD0B9] bg-white px-6 py-3.5 shadow-md transition-all hover:shadow-lg">
              <ArrowDownAZ className="h-5 w-5 text-[#6B5A2A]" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="bg-transparent font-['Inter'] text-base text-[#3E3D1A] focus:outline-none cursor-pointer"
              >
                <option value="recent">Most recent</option>
                <option value="name">Name</option>
                <option value="nowPlaying">Now playing first</option>
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <SummaryCard label="Total Friends" value={summary.total} icon="👥" />
            <SummaryCard label="Now Playing" value={summary.nowPlaying} icon="🎵" />
            <SummaryCard label="Recently Active" value={summary.activeRecently} icon="⚡" />
          </div>
        </header>

        {/* Friends List */}
        <div className="rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
          {filteredFriends.length === 0 ? (
            <p className="py-12 text-center font-['Inter'] text-base text-[#6B5A2A]">
              No friends found for your current search.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredFriends.map((friend) => {
                const track = friend.recentTrack;
                const artistName = track?.artist?.['#text'] || track?.artist?.name || 'Unknown artist';
                const isNowPlaying = track?.['@attr']?.nowplaying === 'true';

                return (
                  <a
                    key={friend.name}
                    href={`https://www.last.fm/user/${friend.name}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      padding: '1.5rem',
                      backgroundColor: 'rgba(238, 206, 164, 0.25)',
                      borderRadius: '20px',
                      border: '1px solid rgba(207, 208, 185, 0.3)',
                      transition: 'all 0.2s',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(238, 206, 164, 0.45)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(238, 206, 164, 0.25)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
                      {/* Track Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1', minWidth: '250px' }}>
                        <div style={{
                          backgroundColor: 'rgba(107, 90, 42, 0.15)',
                          borderRadius: '50%',
                          padding: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Music2 className="h-6 w-6 text-[#6B5A2A]" />
                        </div>
                        {track ? (
                          <div style={{ minWidth: '0', flex: '1' }}>
                            <p style={{
                              fontFamily: 'Inter',
                              fontSize: '1.1rem',
                              fontWeight: '600',
                              color: '#3E3D1A',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginBottom: '0.25rem'
                            }}>
                              {track.name}
                            </p>
                            <p style={{
                              fontFamily: 'Inter',
                              fontSize: '0.95rem',
                              color: '#6B5A2A',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {artistName}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem' }}>
                              <Clock3 className="h-4 w-4 text-[#6B5A2A]/70" />
                              <p style={{
                                fontFamily: 'Inter',
                                fontSize: '0.8rem',
                                fontWeight: isNowPlaying ? '600' : '400',
                                color: isNowPlaying ? '#6B5A2A' : 'rgba(107, 90, 42, 0.7)'
                              }}>
                                {isNowPlaying ? '🎵 Now playing' : 'Recently played'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p style={{
                            fontFamily: 'Inter',
                            fontSize: '0.95rem',
                            color: 'rgba(107, 90, 42, 0.7)'
                          }}>
                            No recent track available
                          </p>
                        )}
                      </div>

                      {/* Friend Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img
                          src={friend.image?.[2]?.['#text'] || '/placeholder.png'}
                          alt={friend.realname || friend.name}
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            border: '3px solid rgba(207, 208, 185, 0.5)',
                            objectFit: 'cover',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <div>
                          <p style={{
                            fontFamily: 'Inter',
                            fontSize: '1.05rem',
                            fontWeight: '600',
                            color: '#3E3D1A',
                            marginBottom: '0.25rem'
                          }}>
                            {friend.realname || friend.name}
                          </p>
                          <p style={{
                            fontFamily: 'Inter',
                            fontSize: '0.875rem',
                            color: '#6B5A2A'
                          }}>
                            @{friend.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Taste Comparator */}
        <div className="mt-8">
          <TasteComparator username={username} />
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon }) => (
  <article className="rounded-[25px] bg-gradient-to-br from-[#EECEA4]/40 to-[#FFE5D9]/30 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30 transition-all hover:shadow-xl hover:scale-105">
    <div className="flex items-center justify-between mb-3">
      <p className="font-['Inter'] text-xs font-semibold uppercase tracking-wider text-[#3E3D1A]/70">
        {label}
      </p>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className="font-['Inter'] text-4xl font-bold text-[#3E3D1A]">
      {value}
    </p>
  </article>
);

export default Friends;