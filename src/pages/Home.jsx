import { useEffect, useMemo, useState } from 'react';
import { getUserInfo, getRecentTracks } from '../services/lastfm';
import { Loader2, Music2, Clock, Users, Search, ListFilter } from 'lucide-react';
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
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNowPlayingOnly, setShowNowPlayingOnly] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const [user, tracks] = await Promise.all([
          getUserInfo(username),
          getRecentTracks(username, 30),
        ]);

        setUserInfo(user);
        setRecentTracks(tracks?.track || []);
      } catch (fetchError) {
        console.error('Error fetching data:', fetchError);
        setError('Could not load your listening data right now. Please try again in a moment.');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchData();
    }
  }, [username]);

  const userImage = getLastFmImageUrl(userInfo?.image);

  const filteredTracks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return recentTracks.filter((track) => {
      const isNowPlaying = track['@attr']?.nowplaying === 'true';
      if (showNowPlayingOnly && !isNowPlaying) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const artistName = track.artist?.['#text'] || track.artist?.name || '';
      const albumName = track.album?.['#text'] || '';

      return [track.name, artistName, albumName]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [recentTracks, searchTerm, showNowPlayingOnly]);

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Tracks</h2>

            <div className="flex flex-col sm:flex-row gap-3 md:max-w-xl w-full">
              <label className="relative flex-1">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by track, artist, or album"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full bg-gray-700 text-gray-100 rounded-md pl-9 pr-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowNowPlayingOnly((current) => !current)}
                className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 border transition ${
                  showNowPlayingOnly
                    ? 'bg-green-600/20 text-green-300 border-green-500/50'
                    : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <ListFilter className="w-4 h-4" />
                Now Playing only
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-300 bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
              {error}
            </p>
          )}

          {!error && filteredTracks.length === 0 && (
            <p className="text-gray-400 text-center py-8">
              {recentTracks.length === 0
                ? 'No recent tracks found.'
                : 'No tracks match the selected filters.'}
            </p>
          )}

          <div className="space-y-4">
            {filteredTracks.map((track) => {
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

              const trackKey = `${track.name}-${artistName}-${track.date?.uts || track.url}`;

              return (
                <div
                  key={trackKey}
                  className="flex items-center space-x-4 bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition"
                >
                  <img
                    src={trackImage || '/placeholder.png'}
                    alt={track.name}
                    className="w-16 h-16 rounded"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{track.name}</p>
                    <p className="text-gray-400 truncate">{artistName}</p>
                    {albumName && (
                      <p className="text-gray-500 text-sm truncate">{albumName}</p>
                    )}

                    {/* Links */}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {trackQuery && (
                        <>
                          <MusicLink label="Track • YouTube" variant="youtube" url={getYouTubeSearchUrl(trackQuery)} />
                          <MusicLink label="Track • Spotify" variant="spotify" url={getSpotifySearchUrl(trackQuery)} />
                        </>
                      )}
                      {artistQuery && (
                        <>
                          <MusicLink label="Artist • YouTube" variant="youtubeMuted" url={getYouTubeSearchUrl(artistQuery)} />
                          <MusicLink label="Artist • Spotify" variant="spotifyMuted" url={getSpotifySearchUrl(artistQuery)} />
                        </>
                      )}
                      {albumQuery && (
                        <>
                          <MusicLink label="Album • YouTube" variant="youtubeMuted" url={getYouTubeSearchUrl(albumQuery)} />
                          <MusicLink label="Album • Spotify" variant="spotifyMuted" url={getSpotifySearchUrl(albumQuery)} />
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

const linkVariantClasses = {
  youtube: 'bg-red-500/20 text-red-300 hover:bg-red-500/30',
  spotify: 'bg-green-500/20 text-green-300 hover:bg-green-500/30',
  youtubeMuted: 'bg-red-500/10 text-red-300 hover:bg-red-500/20',
  spotifyMuted: 'bg-green-500/10 text-green-300 hover:bg-green-500/20',
};

const MusicLink = ({ label, url, variant }) => (
  <a
    href={url}
    target="_blank"
    rel="noreferrer"
    className={`px-2 py-1 rounded-full transition ${linkVariantClasses[variant] || linkVariantClasses.youtubeMuted}`}
  >
    {label}
  </a>
);

export default Home;
