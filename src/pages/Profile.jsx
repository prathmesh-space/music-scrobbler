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
  Sparkles,
  Headphones,
} from 'lucide-react';
import { getRecentTracks, getTopArtists, getUserInfo } from '../services/lastfm';

const numberFormatter = new Intl.NumberFormat();

const formatDate = (unixTimestamp) => {
  if (!unixTimestamp) return 'Not available';
  return new Date(Number(unixTimestamp) * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function Profile({ username }) {
  const [userInfo, setUserInfo] = useState(null);
  const [recentTracks, setRecentTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');

        const [user, recent, artists] = await Promise.all([
          getUserInfo(username),
          getRecentTracks(username, 5),
          getTopArtists(username, '7day', 4),
        ]);

        setUserInfo(user);
        setRecentTracks(recent?.track || []);
        setTopArtists(artists?.artist || []);
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

  const heroSubtitle = useMemo(() => {
    if (!userInfo) {
      return 'Review your Last.fm identity, account status, and personalization at a glance.';
    }

    const playcount = userInfo.playcount ? numberFormatter.format(Number(userInfo.playcount)) : '0';
    return `Tracking ${playcount} scrobbles with ${numberFormatter.format(recentTracks.length)} recent listening updates.`;
  }, [recentTracks.length, userInfo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-xl border border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {userInfo?.image?.[3]?.['#text'] ? (
                <img
                  src={userInfo.image[3]['#text']}
                  alt={userInfo.name}
                  className="h-20 w-20 rounded-full border-2 border-purple-400/60 object-cover"
                />
              ) : (
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/10">
                  <UserRound className="h-8 w-8 text-purple-300" />
                </div>
              )}

              <div>
                <p className="text-sm uppercase tracking-wide text-purple-300">Profile page</p>
                <h1 className="mt-1 text-3xl font-bold text-white">{userInfo?.realname || username || 'Music Scrobbler User'}</h1>
                <p className="text-gray-400">@{userInfo?.name || username || 'unknown-user'}</p>
                <p className="mt-2 text-gray-300">{heroSubtitle}</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Last.fm session connected
            </span>
          </div>
        </section>

        {error && (
          <section className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-200">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </p>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <ProfileStat
            icon={Music2}
            label="Total Scrobbles"
            value={userInfo?.playcount ? numberFormatter.format(Number(userInfo.playcount)) : '0'}
          />
          <ProfileStat
            icon={CalendarDays}
            label="Member Since"
            value={formatDate(userInfo?.registered?.['#text'])}
          />
          <ProfileStat icon={Globe} label="Country" value={userInfo?.country || 'Not set'} />
          <ProfileStat
            icon={Users}
            label="Playlists"
            value={userInfo?.playlists ? numberFormatter.format(Number(userInfo.playlists)) : '0'}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
              <Headphones className="h-5 w-5 text-purple-300" />
              Latest listening activity
            </h2>

            {recentTracks.length > 0 ? (
              <ul className="space-y-3">
                {recentTracks.slice(0, 5).map((track, index) => (
                  <li key={`${track.name}-${index}`} className="rounded-md border border-gray-700 bg-gray-900/70 px-4 py-3">
                    <p className="font-medium text-gray-100">{track.name}</p>
                    <p className="text-sm text-gray-400">{track.artist?.['#text'] || track.artist?.name || 'Unknown artist'}</p>
                    <p className="text-xs text-gray-500">
                      {track.date?.uts ? formatDate(track.date.uts) : 'Now playing'}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No recent tracks found yet.</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
              <Radio className="h-5 w-5 text-purple-300" />
              Top artists this week
            </h2>

            {topArtists.length > 0 ? (
              <ul className="space-y-3">
                {topArtists.map((artist) => (
                  <li key={artist.name} className="flex items-center justify-between rounded-md border border-gray-700 bg-gray-900/70 px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-100">{artist.name}</p>
                      <p className="text-xs text-gray-500">{artist.url?.replace('https://www.last.fm/music/', '')}</p>
                    </div>
                    <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300">
                      {numberFormatter.format(Number(artist.playcount || 0))} plays
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No artist trends available yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Sparkles className="h-5 w-5 text-purple-300" />
            Profile preferences roadmap
          </h2>
          <p className="mt-2 text-gray-400">
            This area is reserved for account-level controls such as default chart periods, audio source preferences, and recommendation tuning.
          </p>
        </section>
      </div>
    </div>
  );
}

function ProfileStat({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
      <div className="flex items-center gap-3">
        {createElement(icon, { className: "h-5 w-5 text-purple-300" })}
        <h2 className="text-sm font-semibold text-white">{label}</h2>
      </div>
      <p className="mt-3 text-lg font-semibold text-gray-100">{value}</p>
    </div>
  );
}
