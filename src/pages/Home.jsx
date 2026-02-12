import { useEffect, useMemo, useState } from 'react';
import { getUserInfo, getRecentTracks } from '../services/lastfm';
import {
  Loader2,
  Music2,
  Search,
  ListFilter,
  ArrowDownAZ,
  ArrowUpZA,
  Clock3,
  Save,
} from 'lucide-react';
import { buildSearchQuery, getSpotifySearchUrl, getYouTubeSearchUrl } from '../utils/musicLinks';
import { getLastFmImageUrl } from '../utils/lastfmImage.js';
import { getCachedData, setCachedData } from '../utils/cache';

const JOURNAL_KEY = 'music-scrobbler-session-journal';

const getHourBucket = (date) => {
  const hour = date.getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const Home = ({ username }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offlineUsingCache, setOfflineUsingCache] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNowPlayingOnly, setShowNowPlayingOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [timeOfDay, setTimeOfDay] = useState('all');
  const [weekdayMode, setWeekdayMode] = useState('all');
  const [repeatedOnly, setRepeatedOnly] = useState(false);
  const [skipStreakOnly, setSkipStreakOnly] = useState(false);
  const [journalMood, setJournalMood] = useState('focused');
  const [journalNote, setJournalNote] = useState('');
  const [journalEntries, setJournalEntries] = useState(() => JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]'));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      setOfflineUsingCache(false);

      try {
        const [user, tracks] = await Promise.all([getUserInfo(username), getRecentTracks(username, 60)]);
        const normalizedTracks = tracks?.track || [];
        setUserInfo(user);
        setRecentTracks(normalizedTracks);
        setCachedData(`home:${username}`, { user, tracks: normalizedTracks });
      } catch (fetchError) {
        const cached = getCachedData(`home:${username}`);
        if (cached) {
          setUserInfo(cached.user || null);
          setRecentTracks(Array.isArray(cached.tracks) ? cached.tracks : []);
          setOfflineUsingCache(true);
          setError('You appear to be offline. Showing your last cached Home snapshot.');
        } else {
          console.error('Error fetching data:', fetchError);
          setError('Could not load your listening data right now. Please try again in a moment.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchData();
  }, [username]);

  const userImage = getLastFmImageUrl(userInfo?.image);

  const repeatedTracks = useMemo(() => {
    const map = new Map();
    recentTracks.forEach((track) => {
      const artist = track.artist?.['#text'] || track.artist?.name || '';
      const key = `${track.name || ''}::${artist}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [recentTracks]);

  const tracksSummary = useMemo(() => {
    const nowPlayingCount = recentTracks.filter((track) => track['@attr']?.nowplaying === 'true').length;
    const uniqueArtistsCount = new Set(
      recentTracks.map((track) => track.artist?.['#text'] || track.artist?.name || '').filter(Boolean),
    ).size;

    return { nowPlaying: nowPlayingCount, uniqueArtists: uniqueArtistsCount };
  }, [recentTracks]);

  const filteredTracks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const visibleTracks = recentTracks.filter((track, index) => {
      const isNowPlaying = track['@attr']?.nowplaying === 'true';
      const artistName = track.artist?.['#text'] || track.artist?.name || '';
      const albumName = track.album?.['#text'] || '';
      const timestamp = Number(track.date?.uts || 0) * 1000;
      const date = timestamp ? new Date(timestamp) : new Date();
      const key = `${track.name || ''}::${artistName}`;

      if (showNowPlayingOnly && !isNowPlaying) return false;
      if (timeOfDay !== 'all' && getHourBucket(date) !== timeOfDay) return false;
      if (weekdayMode === 'weekday' && (date.getDay() === 0 || date.getDay() === 6)) return false;
      if (weekdayMode === 'weekend' && date.getDay() !== 0 && date.getDay() !== 6) return false;
      if (repeatedOnly && (repeatedTracks.get(key) || 0) < 2) return false;

      if (skipStreakOnly) {
        const nextTrack = recentTracks[index + 1];
        const nextUts = Number(nextTrack?.date?.uts || 0);
        const thisUts = Number(track.date?.uts || 0);
        if (!nextUts || !thisUts || thisUts - nextUts > 45) return false;
      }

      if (!normalizedSearch) return true;
      return [track.name, artistName, albumName].join(' ').toLowerCase().includes(normalizedSearch);
    });

    return [...visibleTracks].sort((trackA, trackB) => {
      if (sortBy === 'track-asc') return (trackA.name || '').localeCompare(trackB.name || '', undefined, { sensitivity: 'base' });
      if (sortBy === 'track-desc') return (trackB.name || '').localeCompare(trackA.name || '', undefined, { sensitivity: 'base' });
      const timestampA = Number(trackA.date?.uts || 0);
      const timestampB = Number(trackB.date?.uts || 0);
      return timestampB - timestampA;
    });
  }, [recentTracks, searchTerm, showNowPlayingOnly, sortBy, timeOfDay, weekdayMode, repeatedOnly, skipStreakOnly, repeatedTracks]);

  const saveJournalEntry = () => {
    if (!journalNote.trim()) return;
    const entry = { id: Date.now(), mood: journalMood, note: journalNote.trim(), createdAt: new Date().toISOString() };
    const next = [entry, ...journalEntries].slice(0, 20);
    setJournalEntries(next);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(next));
    setJournalNote('');
  };

  if (loading) return <div className="page-shell page-shell--center"><Loader2 className="w-12 h-12 text-purple-400 animate-spin" /></div>;

  return (
    <div className="page-shell">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="flex items-center space-x-4 mb-6">
            {userImage && <img src={userImage} alt={userInfo?.name || 'Profile'} className="w-20 h-20 rounded-full border-4 border-purple-400" />}
            <div>
              <h1 className="text-3xl font-bold text-white">{userInfo?.realname || userInfo?.name}</h1>
              <p className="text-gray-400">@{userInfo?.name}</p>
            </div>
          </div>

          {error ? <p className={`mb-4 rounded-md border px-3 py-2 text-sm ${offlineUsingCache ? 'border-amber-700 bg-amber-900/30 text-amber-200' : 'border-red-700 bg-red-900/30 text-red-200'}`}>{error}</p> : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Stat label="Total Scrobbles" value={userInfo?.playcount} />
            <Stat label="Country" value={userInfo?.country || 'Unknown'} />
            <Stat label="Member Since" value={userInfo?.registered?.['#text'] ? new Date(+userInfo.registered['#text'] * 1000).getFullYear() : 'N/A'} />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Tracks</h2>
            <div className="grid w-full gap-2 md:max-w-3xl md:grid-cols-2 lg:grid-cols-3">
              <label className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input aria-label="Filter tracks" type="text" placeholder="Track, artist, album" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full bg-gray-700 text-gray-100 rounded-md pl-9 pr-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </label>

              <select aria-label="Time of day filter" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} className="bg-gray-700 text-gray-100 rounded-md px-3 py-2 border border-gray-600">
                <option value="all">All times</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option><option value="night">Night</option>
              </select>

              <select aria-label="Weekday filter" value={weekdayMode} onChange={(e) => setWeekdayMode(e.target.value)} className="bg-gray-700 text-gray-100 rounded-md px-3 py-2 border border-gray-600">
                <option value="all">All days</option><option value="weekday">Weekdays</option><option value="weekend">Weekends</option>
              </select>

              <button type="button" onClick={() => setShowNowPlayingOnly((current) => !current)} className={`px-4 py-2 rounded-md border text-sm font-medium ${showNowPlayingOnly ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'}`}>
                <Clock3 className="w-4 h-4 inline mr-1" /> Now playing
              </button>

              <button type="button" onClick={() => setRepeatedOnly((v) => !v)} className={`px-4 py-2 rounded-md border text-sm font-medium ${repeatedOnly ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'}`}>
                <ListFilter className="w-4 h-4 inline mr-1" /> Repeated tracks
              </button>

              <button type="button" onClick={() => setSkipStreakOnly((v) => !v)} className={`px-4 py-2 rounded-md border text-sm font-medium ${skipStreakOnly ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'}`}>
                <ListFilter className="w-4 h-4 inline mr-1" /> Skip streaks
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <p className="text-sm text-gray-400">Showing {filteredTracks.length} tracks · {tracksSummary.nowPlaying} now playing · {tracksSummary.uniqueArtists} artists</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setSortBy('recent')} className={`px-3 py-1 rounded text-xs ${sortBy === 'recent' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Recent</button>
              <button onClick={() => setSortBy('track-asc')} className={`px-3 py-1 rounded text-xs ${sortBy === 'track-asc' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}><ArrowDownAZ className="inline w-3 h-3 mr-1" /> A-Z</button>
              <button onClick={() => setSortBy('track-desc')} className={`px-3 py-1 rounded text-xs ${sortBy === 'track-desc' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}><ArrowUpZA className="inline w-3 h-3 mr-1" /> Z-A</button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTracks.slice(0, 40).map((track, index) => {
              const artist = track.artist?.['#text'] || track.artist?.name || 'Unknown artist';
              const query = buildSearchQuery({ type: 'track', name: track.name, artist });
              const repeated = repeatedTracks.get(`${track.name || ''}::${artist}`) || 0;
              return (
                <div key={`${track.name}-${artist}-${track.date?.uts || index}`} className="rounded-md border border-gray-700 bg-gray-700/60 p-3">
                  <p className="font-medium text-white">{track.name}</p>
                  <p className="text-sm text-gray-300">{artist} {repeated > 1 ? `· repeated ${repeated}x` : ''}</p>
                  <div className="mt-2 flex gap-2 text-xs">
                    <a target="_blank" rel="noreferrer" href={getSpotifySearchUrl(query)} className="rounded-full border border-green-500/60 px-2 py-1 text-green-300">Spotify</a>
                    <a target="_blank" rel="noreferrer" href={getYouTubeSearchUrl(query)} className="rounded-full border border-red-500/60 px-2 py-1 text-red-300">YouTube</a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <section className="rounded-xl border border-gray-700 bg-gray-800 p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">Session insights journal</h2>
          <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
            <select value={journalMood} onChange={(e) => setJournalMood(e.target.value)} className="rounded-md border border-gray-600 bg-gray-700 px-3 py-2">
              <option value="focused">Focused</option><option value="energetic">Energetic</option><option value="relaxed">Relaxed</option><option value="nostalgic">Nostalgic</option><option value="social">Social</option>
            </select>
            <input value={journalNote} onChange={(e) => setJournalNote(e.target.value)} placeholder="Write a quick note about this listening session" className="rounded-md border border-gray-600 bg-gray-700 px-3 py-2" />
            <button type="button" onClick={saveJournalEntry} className="rounded-md border border-purple-500 bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-500"><Save className="inline h-4 w-4 mr-1" /> Save</button>
          </div>
          <div className="mt-4 space-y-2">
            {journalEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-md border border-gray-700 bg-gray-700/50 px-3 py-2 text-sm">
                <p className="text-purple-200">{entry.mood}</p>
                <p>{entry.note}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
    <div className="flex items-center space-x-3">
      <Music2 className="w-5 h-5 text-purple-400" />
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  </div>
);

export default Home;
