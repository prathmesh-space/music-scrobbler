import { useEffect, useState } from 'react';
import { getUserInfo, getRecentTracks } from '../services/lastfm';
import { Loader2, Music2, Clock, Users } from 'lucide-react';

const Home = ({ username }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [user, tracks] = await Promise.all([
          getUserInfo(username),
          getRecentTracks(username, 10),
        ]);
        setUserInfo(user);
        setRecentTracks(tracks.track || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchData();
    }
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
      <div className="max-w-6xl mx-auto">
        {/* User Stats */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="flex items-center space-x-4 mb-6">
            {userInfo?.image?.[3]?.['#text'] && (
              <img
                src={userInfo.image[3]['#text']}
                alt={userInfo.name}
                className="w-20 h-20 rounded-full border-4 border-purple-400"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">{userInfo?.realname || userInfo?.name}</h1>
              <p className="text-gray-400">@{userInfo?.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Music2 className="w-5 h-5 text-purple-400" />
                <span className="text-gray-400">Total Scrobbles</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {parseInt(userInfo?.playcount || 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="text-gray-400">Country</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {userInfo?.country || 'Unknown'}
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-gray-400">Member Since</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {userInfo?.registered?.['#text'] 
                  ? new Date(parseInt(userInfo.registered['#text']) * 1000).getFullYear()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Tracks */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Tracks</h2>
          
          <div className="space-y-4">
            {recentTracks.length > 0 ? (
              recentTracks.map((track, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition"
                >
                  <img
                    src={track.image?.[2]?.['#text'] || '/placeholder.png'}
                    alt={track.name}
                    className="w-16 h-16 rounded"
                  />
                  <div className="flex-1">
                    <p className="text-white font-semibold">{track.name}</p>
                    <p className="text-gray-400">{track.artist?.['#text'] || track.artist?.name}</p>
                    {track.album?.['#text'] && (
                      <p className="text-gray-500 text-sm">{track.album['#text']}</p>
                    )}
                  </div>
                  {track['@attr']?.nowplaying === 'true' && (
                    <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                      Now Playing
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No recent tracks found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;