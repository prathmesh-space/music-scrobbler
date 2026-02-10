import { useState } from 'react';
import { getTopArtists } from '../../services/lastfm';
import { Users, Loader2, ArrowRight } from 'lucide-react';

const TasteComparator = ({ username }) => {
  const [friendUsername, setFriendUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);

  const compareUsers = async () => {
    if (!friendUsername.trim()) return;

    setLoading(true);
    try {
      const [user1Data, user2Data] = await Promise.all([
        getTopArtists(username, 'overall', 100),
        getTopArtists(friendUsername, 'overall', 100),
      ]);

      const user1Artists = user1Data.artist || [];
      const user2Artists = user2Data.artist || [];

      const user1Set = new Set(user1Artists.map((artist) => artist.name.toLowerCase()));
      const user2Set = new Set(user2Artists.map((artist) => artist.name.toLowerCase()));

      const common = user1Artists.filter((artist) => user2Set.has(artist.name.toLowerCase()));

      const uniqueUser1 = user1Artists
        .filter((artist) => !user2Set.has(artist.name.toLowerCase()))
        .slice(0, 10);

      const uniqueUser2 = user2Artists
        .filter((artist) => !user1Set.has(artist.name.toLowerCase()))
        .slice(0, 10);

      const intersection = common.length;
      const union = user1Set.size + user2Set.size - intersection;
      const similarity = union === 0 ? '0.0' : ((intersection / union) * 100).toFixed(1);

      setComparison({
        user1: username,
        user2: friendUsername,
        similarity,
        common,
        uniqueUser1,
        uniqueUser2,
      });
    } catch (error) {
      console.error('Error comparing users:', error);
      alert('Error comparing users. Make sure both usernames exist on Last.fm.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center space-x-3 mb-6">
        <Users className="w-7 h-7 text-purple-400" />
        <h2 className="text-2xl font-bold text-white">Taste Comparator</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
        <div className="flex-1">
          <label className="block text-gray-400 mb-2 font-semibold">Your Username</label>
          <input
            type="text"
            value={username}
            disabled
            className="w-full px-4 py-3 bg-gray-700 text-gray-400 rounded-lg border border-gray-600"
          />
        </div>

        <ArrowRight className="w-6 h-6 text-purple-400 hidden md:block mb-3" />

        <div className="flex-1">
          <label className="block text-gray-400 mb-2 font-semibold">Friend's Username</label>
          <input
            type="text"
            value={friendUsername}
            onChange={(e) => setFriendUsername(e.target.value)}
            placeholder="Enter Last.fm username"
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && compareUsers()}
          />
        </div>

        <button
          type="button"
          onClick={compareUsers}
          disabled={loading || !friendUsername.trim()}
          className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition flex items-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Comparing...</span>
            </>
          ) : (
            <>
              <Users className="w-5 h-5" />
              <span>Compare</span>
            </>
          )}
        </button>
      </div>

      {comparison && (
        <>
          <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-8 mb-8 text-center border border-purple-700">
            <h3 className="text-2xl font-bold text-white mb-4">Compatibility Score</h3>
            <div className="text-6xl font-bold text-white mb-2">{comparison.similarity}%</div>
            <p className="text-purple-200">You have {comparison.common.length} artists in common</p>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-6 mb-8 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-4">Common Artists ({comparison.common.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {comparison.common.slice(0, 12).map((artist) => (
                <div key={artist.name} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition">
                  {artist.image?.[2]?.['#text'] && (
                    <img
                      src={artist.image[2]['#text']}
                      alt={artist.name}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  <p className="text-white font-semibold text-center truncate">{artist.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Only {comparison.user1} Listens To</h3>
              <div className="space-y-3">
                {comparison.uniqueUser1.map((artist) => (
                  <div key={`${comparison.user1}-${artist.name}`} className="flex items-center space-x-3 bg-gray-700 rounded p-3 hover:bg-gray-600 transition">
                    {artist.image?.[1]?.['#text'] && (
                      <img src={artist.image[1]['#text']} alt={artist.name} className="w-12 h-12 rounded" />
                    )}
                    <div>
                      <p className="text-white font-semibold">{artist.name}</p>
                      <p className="text-gray-400 text-sm">{parseInt(artist.playcount, 10).toLocaleString()} plays</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Only {comparison.user2} Listens To</h3>
              <div className="space-y-3">
                {comparison.uniqueUser2.map((artist) => (
                  <div key={`${comparison.user2}-${artist.name}`} className="flex items-center space-x-3 bg-gray-700 rounded p-3 hover:bg-gray-600 transition">
                    {artist.image?.[1]?.['#text'] && (
                      <img src={artist.image[1]['#text']} alt={artist.name} className="w-12 h-12 rounded" />
                    )}
                    <div>
                      <p className="text-white font-semibold">{artist.name}</p>
                      <p className="text-gray-400 text-sm">{parseInt(artist.playcount, 10).toLocaleString()} plays</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {!comparison && !loading && (
        <div className="bg-gray-900/50 rounded-lg p-8 border border-gray-700 text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Compare Your Music Taste</h3>
          <p className="text-gray-400">Enter a friend's Last.fm username to see how similar your music tastes are.</p>
        </div>
      )}
    </div>
  );
};

export default TasteComparator;
