import { useEffect, useState } from 'react';
import { getUserInfo, getRecentTracks } from '../services/lastfm';
import { Loader2, Music2, Clock, Users } from 'lucide-react';
import {
  buildSearchQuery,
  getSpotifySearchUrl,
  getYouTubeSearchUrl,
} from '../utils/musicLinks';
import { getLastFmImageUrl } from '../utils/lastfmImage.js';

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
        setRecentTracks(tracks?.track || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchData();
  }, [username]);

  const userImage = getLastFmImageUrl(userInfo?.image);

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

        {/* User Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="flex items-center space-x-4 mb-6">
            {userImage && (
              <img
                src={userImage}
                alt={userInfo.name}
                className="w-20 h-20 rounded-full border-4 border-purple-400"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">
                {userInfo?.realname || userInfo?.name}
              </h1>
              <p className="text-gray-400">@{userInfo?.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Stat icon={Music2} label="Total Scrobbles" value={userInfo?.playcount} />
            <Stat icon={Users} label="Country" value={userInfo?.country || 'Unknown'} />
            <Stat
              icon={Clock}
              label="Member Since"
              value={
                userInfo?.registered?.['#text']
                  ? new Date(+userInfo.registered['#text'] * 1000).getFullYear()
                  : 'N/A'
              }
            />
          </div>
        </div>

        {/* Recent Tracks */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Tracks</h2>

          {recentTracks.length === 0 && (
            <p className="text-gray-400 text-center py-8">
              No recent tracks found
            </p>
          )}

          <div className="space-y-4">
            {recentTracks.map((track, index) => {
              const artistName = track.artist?.['#text'] || track.artist?.name;
              const albumName = track.album?.['#text'];
              const trackImage = getLastFmImageUrl(track.image);

              const trackQuery = buildSearchQuery({
                type: 'tracks',
                name: track.name,
                artist: artistName,
              });

              const artistQuery = buildSearchQuery({
                type: 'artists',
                name: artistName,
              });

              const albumQuery = albumName
                ? buildSearchQuery({
                    type: 'albums',
                    name: albumName,
                    artist: artistName,
                  })
                : null;

              return (
                <div
                  key={index}
                  className="flex items-center space-x-4 bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition"
                >
                  <img
                    src={trackImage || '/placeholder.png'}
                    alt={track.name}
                    className="w-16 h-16 rounded"
                  />

                  <div className="flex-1">
                    <p className="text-white font-semibold">{track.name}</p>
                    <p className="text-gray-400">{artistName}</p>
                    {albumName && (
                      <p className="text-gray-500 text-sm">{albumName}</p>
                    )}

                    {/* Links */}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {trackQuery && (
                        <>
                          <MusicLink label="Track • YouTube" color="red" url={getYouTubeSearchUrl(trackQuery)} />
                          <MusicLink label="Track • Spotify" color="green" url={getSpotifySearchUrl(trackQuery)} />
                        </>
                      )}
                      {artistQuery && (
                        <>
                          <MusicLink label="Artist • YouTube" color="red" light url={getYouTubeSearchUrl(artistQuery)} />
                          <MusicLink label="Artist • Spotify" color="green" light url={getSpotifySearchUrl(artistQuery)} />
                        </>
                      )}
                      {albumQuery && (
                        <>
                          <MusicLink label="Album • YouTube" color="red" light url={getYouTubeSearchUrl(albumQuery)} />
                          <MusicLink label="Album • Spotify" color="green" light url={getSpotifySearchUrl(albumQuery)} />
                        </>
                      )}
                    </div>
                  </div>

                  {track['@attr']?.nowplaying === 'true' && (
                    <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                      Now Playing
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* Small reusable components */

const Stat = ({ icon, label, value }) => {
  const IconComponent = icon;

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-2">
        {IconComponent ? <IconComponent className="w-5 h-5 text-purple-400" /> : null}
        <span className="text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">
        {value?.toString?.() || value}
      </p>
    </div>
  );
};

const MusicLink = ({ label, url, color, light }) => (
  <a
    href={url}
    target="_blank"
    rel="noreferrer"
    className={`px-2 py-1 rounded-full 
      bg-${color}-500/${light ? '10' : '20'} 
      text-${color}-300 
      hover:bg-${color}-500/${light ? '20' : '30'} 
      transition`}
  >
    {label}
  </a>
);

export default Home;
