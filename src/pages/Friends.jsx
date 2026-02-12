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
      <div className="page-shell page-shell--center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <UserRound className="w-7 h-7 text-purple-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Friends</h1>
                <p className="text-sm text-gray-400">Keep up with your friends' latest scrobbles and compare your taste.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-gray-200">
                <Search className="h-4 w-4 text-purple-300" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search friends or tracks"
                  className="w-44 bg-transparent text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none"
                />
              </label>

              <label className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-gray-200">
                <ArrowDownAZ className="h-4 w-4 text-purple-300" />
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="bg-transparent text-sm focus:outline-none"
                >
                  <option value="recent" className="text-gray-900">Most recent</option>
                  <option value="name" className="text-gray-900">Name</option>
                  <option value="nowPlaying" className="text-gray-900">Now playing first</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Total friends" value={summary.total} />
            <SummaryCard label="Now playing" value={summary.nowPlaying} />
            <SummaryCard label="Recently active" value={summary.activeRecently} />
          </div>

          {filteredFriends.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No friends found for your current search.</p>
          ) : (
            <div className="mt-6 space-y-3">
              {filteredFriends.map((friend) => {
                const track = friend.recentTrack;
                const artistName = track?.artist?.['#text'] || track?.artist?.name || 'Unknown artist';

                return (
                  <a
                    key={friend.name}
                    href={`https://www.last.fm/user/${friend.name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition"
                  >
                    <div className="flex items-center gap-3 border-r-0 md:border-r md:border-gray-600 md:pr-4">
                      <Music2 className="w-5 h-5 text-purple-300 shrink-0" />
                      {track ? (
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{track.name}</p>
                          <p className="text-gray-300 text-sm truncate">{artistName}</p>
                          <p className="text-gray-400 text-xs inline-flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />
                            {track['@attr']?.nowplaying === 'true' ? 'Now playing' : 'Recently played'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No recent track available</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 md:justify-end">
                      <img
                        src={friend.image?.[2]?.['#text'] || '/placeholder.png'}
                        alt={friend.realname || friend.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="md:text-right">
                        <p className="text-white font-semibold">{friend.realname || friend.name}</p>
                        <p className="text-gray-400 text-sm">@{friend.name}</p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <TasteComparator username={username} />
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value }) => (
  <article className="rounded-md border border-gray-700 bg-gray-700/40 px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
  </article>
);

export default Friends;
