import { useEffect, useState } from 'react';
import { Loader2, UserRound, Music2 } from 'lucide-react';
import { getFriends, getRecentTracks } from '../services/lastfm';
import TasteComparator from '../components/Comparison/TasteComparator';

const Friends = ({ username }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <UserRound className="w-7 h-7 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Friends</h1>
          </div>

          {friends.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No friends found</p>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => {
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
                          <p className="text-gray-400 text-xs">
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
                        className="w-12 h-12 rounded-full"
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

export default Friends;
