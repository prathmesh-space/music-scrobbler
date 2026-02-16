import { useState } from 'react';
import { getTopArtists, getTopTracks } from '../../services/lastfm';
import { Users, Loader2, ArrowRight, Music, Sparkles, TrendingUp, Heart } from 'lucide-react';

const TasteComparator = ({ username }) => {
  const [friendUsername, setFriendUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [compareMode, setCompareMode] = useState('artists'); // 'artists' or 'tracks'

  const compareUsers = async () => {
    if (!friendUsername.trim()) return;

    setLoading(true);
    try {
      const fetcher = compareMode === 'artists' ? getTopArtists : getTopTracks;
      
      const [user1Data, user2Data] = await Promise.all([
        fetcher(username, 'overall', 100),
        fetcher(friendUsername, 'overall', 100),
      ]);

      const key = compareMode === 'artists' ? 'artist' : 'track';
      const user1Items = user1Data[key] || [];
      const user2Items = user2Data[key] || [];

      const getName = (item) => {
        if (compareMode === 'tracks') {
          const artistName = item.artist?.name || item.artist?.['#text'] || '';
          return `${item.name}-${artistName}`.toLowerCase();
        }
        return item.name.toLowerCase();
      };

      const user1Set = new Set(user1Items.map(getName));
      const user2Set = new Set(user2Items.map(getName));

      const common = user1Items.filter((item) => user2Set.has(getName(item)));

      const uniqueUser1 = user1Items
        .filter((item) => !user2Set.has(getName(item)))
        .slice(0, 12);

      const uniqueUser2 = user2Items
        .filter((item) => !user1Set.has(getName(item)))
        .slice(0, 12);

      const intersection = common.length;
      const union = user1Set.size + user2Set.size - intersection;
      const similarity = union === 0 ? '0.0' : ((intersection / union) * 100).toFixed(1);

      // Calculate compatibility level
      const simValue = parseFloat(similarity);
      let compatibilityLevel = '';
      let compatibilityEmoji = '';
      let compatibilityColor = '';

      if (simValue >= 40) {
        compatibilityLevel = 'Musical Soulmates';
        compatibilityEmoji = '🎵💖';
        compatibilityColor = 'from-pink-500 to-purple-600';
      } else if (simValue >= 25) {
        compatibilityLevel = 'Great Match';
        compatibilityEmoji = '✨🎧';
        compatibilityColor = 'from-purple-500 to-blue-600';
      } else if (simValue >= 15) {
        compatibilityLevel = 'Good Vibes';
        compatibilityEmoji = '🎶👍';
        compatibilityColor = 'from-blue-500 to-teal-600';
      } else if (simValue >= 8) {
        compatibilityLevel = 'Some Overlap';
        compatibilityEmoji = '🎸🤝';
        compatibilityColor = 'from-teal-500 to-green-600';
      } else {
        compatibilityLevel = 'Unique Tastes';
        compatibilityEmoji = '🌟🎭';
        compatibilityColor = 'from-green-500 to-yellow-600';
      }

      setComparison({
        user1: username,
        user2: friendUsername,
        similarity,
        common,
        uniqueUser1,
        uniqueUser2,
        compatibilityLevel,
        compatibilityEmoji,
        compatibilityColor,
      });
    } catch (error) {
      console.error('Error comparing users:', error);
      alert('Error comparing users. Make sure both usernames exist on Last.fm.');
    } finally {
      setLoading(false);
    }
  };

  const getItemName = (item) => {
    if (compareMode === 'tracks') {
      return item.name;
    }
    return item.name;
  };

  const getItemSubtext = (item) => {
    if (compareMode === 'tracks') {
      return item.artist?.name || item.artist?.['#text'] || 'Unknown Artist';
    }
    return `${parseInt(item.playcount, 10).toLocaleString()} plays`;
  };

  return (
    <div className="rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-full bg-[#6B5A2A]/10 p-2">
          <Users className="h-7 w-7 text-[#6B5A2A]" />
        </div>
        <div>
          <h2 className="font-['Amiri_Quran'] text-3xl font-normal text-[#3E3D1A]">
            Taste Comparator
          </h2>
          <p className="font-['Inter'] text-sm text-[#6B5A2A]">
            Compare music tastes with friends
          </p>
        </div>
      </div>

      {/* Compare Mode Toggle */}
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setCompareMode('artists')}
          className={`flex-1 rounded-[20px] px-5 py-3 font-['Inter'] text-sm font-semibold transition-all ${
            compareMode === 'artists'
              ? 'bg-[#6B5A2A] text-white shadow-md'
              : 'bg-[#EECEA4]/30 text-[#3E3D1A] hover:bg-[#EECEA4]/50'
          }`}
        >
          <Music className="mr-2 inline h-4 w-4" />
          Compare Artists
        </button>
        <button
          type="button"
          onClick={() => setCompareMode('tracks')}
          className={`flex-1 rounded-[20px] px-5 py-3 font-['Inter'] text-sm font-semibold transition-all ${
            compareMode === 'tracks'
              ? 'bg-[#6B5A2A] text-white shadow-md'
              : 'bg-[#EECEA4]/30 text-[#3E3D1A] hover:bg-[#EECEA4]/50'
          }`}
        >
          <Sparkles className="mr-2 inline h-4 w-4" />
          Compare Tracks
        </button>
      </div>

      {/* Input Section */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-2 block font-['Inter'] text-sm font-semibold text-[#3E3D1A]/70">
            Your Username
          </label>
          <input
            type="text"
            value={username}
            disabled
            className="w-full rounded-[20px] border-2 border-[#CFD0B9] bg-[#EECEA4]/20 px-5 py-3 font-['Inter'] text-base text-[#6B5A2A]"
          />
        </div>

        <ArrowRight className="mb-3 hidden h-6 w-6 text-[#6B5A2A] md:block" />

        <div className="flex-1">
          <label className="mb-2 block font-['Inter'] text-sm font-semibold text-[#3E3D1A]/70">
            Friend's Username
          </label>
          <input
            type="text"
            value={friendUsername}
            onChange={(e) => setFriendUsername(e.target.value)}
            placeholder="Enter Last.fm username"
            className="w-full rounded-[20px] border-2 border-[#CFD0B9] bg-white px-5 py-3 font-['Inter'] text-base text-[#3E3D1A] transition-all focus:border-[#6B5A2A] focus:outline-none focus:ring-2 focus:ring-[#6B5A2A]/20"
            onKeyDown={(e) => e.key === 'Enter' && compareUsers()}
          />
        </div>

        <button
          type="button"
          onClick={compareUsers}
          disabled={loading || !friendUsername.trim()}
          className="flex items-center justify-center gap-2 rounded-[25px] bg-[#6B5A2A] px-8 py-3 font-['Inter'] text-base font-semibold text-white shadow-md transition-all hover:bg-[#55491A] disabled:bg-[#CFD0B9] disabled:text-[#6B5A2A]/50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Comparing...</span>
            </>
          ) : (
            <>
              <Users className="h-5 w-5" />
              <span>Compare</span>
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Compatibility Score */}
          <div className={`rounded-[25px] bg-gradient-to-r ${comparison.compatibilityColor} p-8 text-center shadow-xl`}>
            <div className="mb-2 text-5xl">{comparison.compatibilityEmoji}</div>
            <h3 className="mb-3 font-['Amiri_Quran'] text-3xl font-normal text-white">
              {comparison.compatibilityLevel}
            </h3>
            <div className="mb-2 text-7xl font-bold text-white">{comparison.similarity}%</div>
            <p className="font-['Inter'] text-lg text-white/90">
              {comparison.common.length} {compareMode} in common
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-[20px] bg-gradient-to-br from-[#EECEA4]/40 to-[#FFE5D9]/30 p-4 text-center ring-1 ring-[#CFD0B9]/30">
              <Heart className="mx-auto mb-2 h-6 w-6 text-[#6B5A2A]" />
              <p className="font-['Inter'] text-2xl font-bold text-[#3E3D1A]">{comparison.common.length}</p>
              <p className="font-['Inter'] text-xs text-[#6B5A2A]">Shared</p>
            </div>
            <div className="rounded-[20px] bg-gradient-to-br from-[#E0F5F0]/40 to-[#C8E6D7]/30 p-4 text-center ring-1 ring-[#CFD0B9]/30">
              <TrendingUp className="mx-auto mb-2 h-6 w-6 text-[#6B5A2A]" />
              <p className="font-['Inter'] text-2xl font-bold text-[#3E3D1A]">{comparison.uniqueUser1.length}</p>
              <p className="font-['Inter'] text-xs text-[#6B5A2A]">Your Unique</p>
            </div>
            <div className="rounded-[20px] bg-gradient-to-br from-[#E8E0F5]/40 to-[#CFD0B9]/30 p-4 text-center ring-1 ring-[#CFD0B9]/30">
              <Sparkles className="mx-auto mb-2 h-6 w-6 text-[#6B5A2A]" />
              <p className="font-['Inter'] text-2xl font-bold text-[#3E3D1A]">{comparison.uniqueUser2.length}</p>
              <p className="font-['Inter'] text-xs text-[#6B5A2A]">Their Unique</p>
            </div>
          </div>

          {/* Common Items */}
          {comparison.common.length > 0 && (
            <div className="rounded-[25px] bg-gradient-to-br from-[#EECEA4]/20 to-[#FFE5D9]/20 p-6 ring-1 ring-[#CFD0B9]/30">
              <h3 className="mb-4 font-['Amiri_Quran'] text-2xl font-normal text-[#3E3D1A]">
                Common {compareMode === 'artists' ? 'Artists' : 'Tracks'} ({comparison.common.length})
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {comparison.common.slice(0, 15).map((item) => (
                  <div
                    key={getItemName(item)}
                    className="rounded-[15px] bg-white/70 p-3 transition-all hover:scale-105 hover:shadow-md"
                  >
                    {item.image?.[2]?.['#text'] ? (
                      <img
                        src={item.image[2]['#text']}
                        alt={getItemName(item)}
                        className="mb-2 h-20 w-full rounded-[10px] object-cover"
                      />
                    ) : (
                      <div className="mb-2 flex h-20 w-full items-center justify-center rounded-[10px] bg-[#EECEA4]/30">
                        <Music className="h-8 w-8 text-[#6B5A2A]/50" />
                      </div>
                    )}
                    <p className="line-clamp-2 font-['Inter'] text-xs font-semibold text-[#3E3D1A]">
                      {getItemName(item)}
                    </p>
                    {compareMode === 'tracks' && (
                      <p className="line-clamp-1 font-['Inter'] text-[10px] text-[#6B5A2A]">
                        {getItemSubtext(item)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unique Items */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* User 1 Unique */}
            <div className="rounded-[25px] bg-gradient-to-br from-[#E0F5F0]/30 to-[#C8E6D7]/20 p-6 ring-1 ring-[#CFD0B9]/30">
              <h3 className="mb-4 font-['Amiri_Quran'] text-xl font-normal text-[#3E3D1A]">
                Only {comparison.user1} Listens To
              </h3>
              <div className="space-y-2">
                {comparison.uniqueUser1.slice(0, 8).map((item) => (
                  <div
                    key={`${comparison.user1}-${getItemName(item)}`}
                    className="flex items-center gap-3 rounded-[15px] bg-white/70 p-3 transition-all hover:bg-white"
                  >
                    {item.image?.[1]?.['#text'] ? (
                      <img
                        src={item.image[1]['#text']}
                        alt={getItemName(item)}
                        className="h-12 w-12 flex-shrink-0 rounded-[8px] object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#EECEA4]/30">
                        <Music className="h-6 w-6 text-[#6B5A2A]/50" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-['Inter'] text-sm font-semibold text-[#3E3D1A]">
                        {getItemName(item)}
                      </p>
                      <p className="line-clamp-1 font-['Inter'] text-xs text-[#6B5A2A]">
                        {getItemSubtext(item)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User 2 Unique */}
            <div className="rounded-[25px] bg-gradient-to-br from-[#E8E0F5]/30 to-[#CFD0B9]/20 p-6 ring-1 ring-[#CFD0B9]/30">
              <h3 className="mb-4 font-['Amiri_Quran'] text-xl font-normal text-[#3E3D1A]">
                Only {comparison.user2} Listens To
              </h3>
              <div className="space-y-2">
                {comparison.uniqueUser2.slice(0, 8).map((item) => (
                  <div
                    key={`${comparison.user2}-${getItemName(item)}`}
                    className="flex items-center gap-3 rounded-[15px] bg-white/70 p-3 transition-all hover:bg-white"
                  >
                    {item.image?.[1]?.['#text'] ? (
                      <img
                        src={item.image[1]['#text']}
                        alt={getItemName(item)}
                        className="h-12 w-12 flex-shrink-0 rounded-[8px] object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#EECEA4]/30">
                        <Music className="h-6 w-6 text-[#6B5A2A]/50" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-['Inter'] text-sm font-semibold text-[#3E3D1A]">
                        {getItemName(item)}
                      </p>
                      <p className="line-clamp-1 font-['Inter'] text-xs text-[#6B5A2A]">
                        {getItemSubtext(item)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!comparison && !loading && (
        <div className="rounded-[25px] bg-gradient-to-br from-[#EECEA4]/20 to-[#FFE5D9]/20 p-12 text-center ring-1 ring-[#CFD0B9]/30">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#6B5A2A]/10">
            <Users className="h-10 w-10 text-[#6B5A2A]" />
          </div>
          <h3 className="mb-2 font-['Amiri_Quran'] text-2xl font-normal text-[#3E3D1A]">
            Compare Your Music Taste
          </h3>
          <p className="font-['Inter'] text-base text-[#6B5A2A]">
            Enter a friend's Last.fm username to see how similar your music tastes are
          </p>
        </div>
      )}
    </div>
  );
};

export default TasteComparator;