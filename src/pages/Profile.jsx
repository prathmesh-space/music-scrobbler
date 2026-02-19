import { createElement, useEffect, useMemo, useState } from 'react';
import {
  UserRound,
  Music2,
  CalendarDays,
  ShieldCheck,
  Globe,
  Users,
  Radio,
  Loader2,
  AlertTriangle,
  Headphones,
  LogOut,
  TrendingUp,
  Clock,
  Award,
} from 'lucide-react';
import { getRecentTracks, getTopArtists, getUserInfo, getTopAlbums } from '../services/lastfm';

const numberFormatter = new Intl.NumberFormat();

const formatDate = (unixTimestamp) => {
  if (!unixTimestamp) return 'Not available';
  return new Date(Number(unixTimestamp) * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatRelativeTime = (unixTimestamp) => {
  if (!unixTimestamp) return 'Recently';
  
  const date = new Date(Number(unixTimestamp) * 1000);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return formatDate(unixTimestamp);
};

export default function Profile({ username, onLogout }) {
  const [userInfo, setUserInfo] = useState(null);
  const [recentTracks, setRecentTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [topAlbums, setTopAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');

        const [user, recent, artists, albums] = await Promise.all([
          getUserInfo(username),
          getRecentTracks(username, 10),
          getTopArtists(username, '7day', 5),
          getTopAlbums(username, '7day', 4),
        ]);

        setUserInfo(user);
        setRecentTracks(recent?.track || []);
        setTopArtists(artists?.artist || []);
        setTopAlbums(albums?.album || []);
      } catch (err) {
        console.error('Failed to load profile data:', err);
        setError('Could not load profile details from Last.fm right now.');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      loadProfile();
    } else {
      setLoading(false);
      setError('No user session found. Please sign in again.');
    }
  }, [username]);

  const accountAge = useMemo(() => {
    if (!userInfo?.registered?.['#text']) return null;
    
    const registeredDate = new Date(Number(userInfo.registered['#text']) * 1000);
    const now = new Date();
    const diffYears = now.getFullYear() - registeredDate.getFullYear();
    const diffMonths = diffYears * 12 + (now.getMonth() - registeredDate.getMonth());
    
    if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
    return `${diffYears} year${diffYears !== 1 ? 's' : ''}`;
  }, [userInfo]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-12 w-12 animate-spin text-[#6B5A2A]" />
          <p className="font-['Inter'] text-lg text-[#3E3D1A]">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ background: 'transparent' }}>
      <div className="mx-auto max-w-6xl">
        {/* Profile Header */}
        <section className="mb-8 rounded-[30px] bg-gradient-to-br from-[#6B5A2A] to-[#55491A] p-8 shadow-xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-5">
              {userInfo?.image?.[3]?.['#text'] ? (
                <img
                  src={userInfo.image[3]['#text']}
                  alt={userInfo.name}
                  className="h-24 w-24 rounded-full border-4 border-white/20 object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20 bg-white/10">
                  <UserRound className="h-12 w-12 text-white" />
                </div>
              )}

              <div>
                <p className="mb-1 font-['Inter'] text-xs font-semibold uppercase tracking-wider text-white/70">
                  Your Profile
                </p>
                <h1 className="mb-1 font-['Amiri_Quran'] text-5xl font-normal text-white">
                  {userInfo?.realname || username || 'Music Lover'}
                </h1>
                <p className="mb-3 font-['Inter'] text-lg text-white/80">
                  @{userInfo?.name || username || 'unknown-user'}
                </p>
                {accountAge && (
                  <p className="font-['Inter'] text-sm text-white/70">
                    🎵 Scrobbling for {accountAge}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 font-['Inter'] text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4" />
                Connected
              </span>
              <button
                type="button"
                onClick={() => onLogout?.()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2 font-['Inter'] text-sm font-semibold text-white transition-all hover:bg-red-700"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <section className="mb-8 rounded-[25px] border-2 border-red-400 bg-red-50 p-4 shadow-md">
            <p className="flex items-center gap-2 font-['Inter'] text-sm font-medium text-red-800">
              <AlertTriangle className="h-5 w-5" />
              {error}
            </p>
          </section>
        )}

        {/* Stats Grid */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileStat
            icon={Music2}
            label="Total Scrobbles"
            value={userInfo?.playcount ? numberFormatter.format(Number(userInfo.playcount)) : '0'}
            color="from-[#EECEA4]/40 to-[#FFE5D9]/30"
          />
          <ProfileStat
            icon={CalendarDays}
            label="Member Since"
            value={userInfo?.registered?.['#text'] ? new Date(Number(userInfo.registered['#text']) * 1000).getFullYear() : 'N/A'}
            color="from-[#E0F5F0]/40 to-[#C8E6D7]/30"
          />
          <ProfileStat
            icon={Globe}
            label="Country"
            value={userInfo?.country || 'Not set'}
            color="from-[#E8E0F5]/40 to-[#CFD0B9]/30"
          />
          <ProfileStat
            icon={Award}
            label="Playlists"
            value={userInfo?.playlists ? numberFormatter.format(Number(userInfo.playlists)) : '0'}
            color="from-[#FFE5D9]/40 to-[#EECEA4]/30"
          />
        </section>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
            <h2 className="mb-5 flex items-center gap-2 font-['Amiri_Quran'] text-2xl font-normal text-[#3E3D1A]">
              <Headphones className="h-6 w-6 text-[#6B5A2A]" />
              Recent Listening
            </h2>

            {recentTracks.length > 0 ? (
              <div className="space-y-3">
                {recentTracks.slice(0, 8).map((track, index) => {
                  const isNowPlaying = track['@attr']?.nowplaying === 'true';
                  return (
                    <div
                      key={`${track.name}-${index}`}
                      className="rounded-[15px] bg-gradient-to-r from-[#EECEA4]/20 to-[#FFE5D9]/20 p-4 ring-1 ring-[#CFD0B9]/30 transition-all hover:from-[#EECEA4]/40 hover:to-[#FFE5D9]/40"
                    >
                      <div className="flex items-center gap-3">
                        {isNowPlaying && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                            <Music2 className="h-4 w-4 animate-pulse text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-['Inter'] text-sm font-semibold text-[#3E3D1A]">
                            {track.name}
                          </p>
                          <p className="truncate font-['Inter'] text-xs text-[#6B5A2A]">
                            {track.artist?.['#text'] || track.artist?.name || 'Unknown artist'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#6B5A2A]/70">
                          <Clock className="h-3.5 w-3.5" />
                          <p className="font-['Inter'] text-xs">
                            {isNowPlaying ? 'Now' : formatRelativeTime(track.date?.uts)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center font-['Inter'] text-sm text-[#6B5A2A]">
                No recent tracks found
              </p>
            )}
          </div>

          {/* Top Artists */}
          <div className="rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
            <h2 className="mb-5 flex items-center gap-2 font-['Amiri_Quran'] text-2xl font-normal text-[#3E3D1A]">
              <Radio className="h-6 w-6 text-[#6B5A2A]" />
              Top Artists
            </h2>
            <p className="mb-4 font-['Inter'] text-xs text-[#6B5A2A]">This week</p>

            {topArtists.length > 0 ? (
              <div className="space-y-3">
                {topArtists.map((artist, index) => (
                  <div
                    key={artist.name}
                    className="flex items-center gap-4 rounded-[15px] bg-gradient-to-r from-[#E0F5F0]/30 to-[#C8E6D7]/20 p-4 ring-1 ring-[#CFD0B9]/30"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6B5A2A] font-['Inter'] text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-['Inter'] text-sm font-semibold text-[#3E3D1A]">
                        {artist.name}
                      </p>
                      <p className="font-['Inter'] text-xs text-[#6B5A2A]">
                        {numberFormatter.format(Number(artist.playcount || 0))} plays
                      </p>
                    </div>
                    {artist.image?.[2]?.['#text'] && (
                      <img
                        src={artist.image[2]['#text']}
                        alt={artist.name}
                        className="h-12 w-12 rounded-[8px] object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center font-['Inter'] text-sm text-[#6B5A2A]">
                No artist data available yet
              </p>
            )}
          </div>
        </div>

        {/* Top Albums */}
        {topAlbums.length > 0 && (
          <div className="mt-6 rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
            <h2 className="mb-5 flex items-center gap-2 font-['Amiri_Quran'] text-2xl font-normal text-[#3E3D1A]">
              <TrendingUp className="h-6 w-6 text-[#6B5A2A]" />
              Top Albums This Week
            </h2>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {topAlbums.map((album) => (
                <div
                  key={`${album.name}-${album.artist?.name}`}
                  className="rounded-[20px] bg-gradient-to-br from-[#EECEA4]/20 to-[#FFE5D9]/20 p-4 ring-1 ring-[#CFD0B9]/30 transition-all hover:scale-105"
                >
                  {album.image?.[3]?.['#text'] ? (
                    <img
                      src={album.image[3]['#text']}
                      alt={album.name}
                      className="mb-3 h-32 w-full rounded-[12px] object-cover"
                    />
                  ) : (
                    <div className="mb-3 flex h-32 w-full items-center justify-center rounded-[12px] bg-[#EECEA4]/30">
                      <Music2 className="h-8 w-8 text-[#6B5A2A]/50" />
                    </div>
                  )}
                  <p className="line-clamp-1 font-['Inter'] text-sm font-semibold text-[#3E3D1A]">
                    {album.name}
                  </p>
                  <p className="line-clamp-1 font-['Inter'] text-xs text-[#6B5A2A]">
                    {album.artist?.name || 'Unknown'}
                  </p>
                  <p className="mt-1 font-['Inter'] text-xs text-[#6B5A2A]/70">
                    {numberFormatter.format(Number(album.playcount || 0))} plays
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileStat({ icon, label, value, color }) {
  return (
    <div className={`rounded-[25px] bg-gradient-to-br ${color} p-5 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30 transition-all hover:scale-105`}>
      <div className="mb-3 flex items-center gap-2">
        {createElement(icon, { className: "h-5 w-5 text-[#6B5A2A]" })}
        <p className="font-['Inter'] text-xs font-semibold uppercase tracking-wider text-[#3E3D1A]/70">
          {label}
        </p>
      </div>
      <p className="font-['Inter'] text-2xl font-bold text-[#3E3D1A]">{value}</p>
    </div>
  );
}