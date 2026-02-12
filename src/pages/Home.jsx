// Updated Home.jsx with Cherry Blossom theme + Inter/Krub typography

import { useEffect, useMemo, useState } from 'react';
import { getUserInfo, getRecentTracks } from '../services/lastfm';
import {
  Loader2,
  Search,
  ArrowDownAZ,
  ArrowUpZA,
  Save,
} from 'lucide-react';
import { buildSearchQuery, getSpotifySearchUrl, getYouTubeSearchUrl } from '../utils/musicLinks';
import { getLastFmImageUrl } from '../utils/lastfmImage.js';
import { getCachedData, setCachedData } from '../utils/cache';

const JOURNAL_KEY = 'music-scrobbler-session-journal';

const Home = ({ username }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [journalMood, setJournalMood] = useState('focused');
  const [journalNote, setJournalNote] = useState('');
  const [journalEntries, setJournalEntries] = useState(() =>
    JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]')
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [user, tracks] = await Promise.all([
          getUserInfo(username),
          getRecentTracks(username, 60),
        ]);
        const normalizedTracks = tracks?.track || [];
        setUserInfo(user);
        setRecentTracks(normalizedTracks);
        setCachedData(`home:${username}`, { user, tracks: normalizedTracks });
      } catch {
        const cached = getCachedData(`home:${username}`);
        if (cached) {
          setUserInfo(cached.user || null);
          setRecentTracks(Array.isArray(cached.tracks) ? cached.tracks : []);
          setError('Offline — showing cached data.');
        } else {
          setError('Could not load your listening data.');
        }
      } finally {
        setLoading(false);
      }
    };
    if (username) fetchData();
  }, [username]);

  const userImage = getLastFmImageUrl(userInfo?.image);

  const filteredTracks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const sorted = [...recentTracks].sort((a, b) => {
      if (sortBy === 'track-asc')
        return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'track-desc')
        return (b.name || '').localeCompare(a.name || '');
      return Number(b.date?.uts || 0) - Number(a.date?.uts || 0);
    });
    if (!normalizedSearch) return sorted;
    return sorted.filter((track) =>
      [track.name, track.artist?.['#text']]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [recentTracks, searchTerm, sortBy]);

  const saveJournalEntry = () => {
    if (!journalNote.trim()) return;
    const entry = {
      id: Date.now(),
      mood: journalMood,
      note: journalNote.trim(),
    };
    const next = [entry, ...journalEntries].slice(0, 20);
    setJournalEntries(next);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(next));
    setJournalNote('');
  };

  if (loading)
    return (
      <div className="page-shell center">
        <Loader2 className="loader" />
      </div>
    );

  return (
    <div className="page-shell">
      <div className="container">
        <div className="card">
          <div className="profile">
            {userImage && (
              <img src={userImage} alt="Profile" className="avatar" />
            )}
            <div>
              <h1 className="brand-heading">
                {userInfo?.realname || userInfo?.name}
              </h1>
              <p className="muted">@{userInfo?.name}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <h2 className="brand-heading small">Recent Tracks</h2>
            <div className="controls">
              <div className="search-wrap">
                <Search className="icon" />
                <input
                  type="text"
                  placeholder="Search tracks"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input"
                />
              </div>
              <button onClick={() => setSortBy('recent')} className="btn-outline">
                Recent
              </button>
              <button onClick={() => setSortBy('track-asc')} className="btn-outline">
                <ArrowDownAZ size={14} /> A–Z
              </button>
              <button onClick={() => setSortBy('track-desc')} className="btn-outline">
                <ArrowUpZA size={14} /> Z–A
              </button>
            </div>
          </div>

          <div className="tracks">
            {filteredTracks.slice(0, 40).map((track, i) => {
              const artist = track.artist?.['#text'] || 'Unknown artist';
              const query = buildSearchQuery({ type: 'track', name: track.name, artist });

              return (
                <div key={i} className="track-card">
                  <p className="track-title">{track.name}</p>
                  <p className="track-artist">{artist}</p>
                  <div className="links">
                    <a href={getSpotifySearchUrl(query)} target="_blank" rel="noreferrer" className="link-chip">
                      Spotify
                    </a>
                    <a href={getYouTubeSearchUrl(query)} target="_blank" rel="noreferrer" className="link-chip">
                      YouTube
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="brand-heading small">Session Journal</h2>
          <div className="journal-input">
            <select value={journalMood} onChange={(e) => setJournalMood(e.target.value)} className="input">
              <option value="focused">Focused</option>
              <option value="energetic">Energetic</option>
              <option value="relaxed">Relaxed</option>
            </select>
            <input
              value={journalNote}
              onChange={(e) => setJournalNote(e.target.value)}
              placeholder="Write a note"
              className="input"
            />
            <button onClick={saveJournalEntry} className="btn-primary">
              <Save size={14} /> Save
            </button>
          </div>

          <div className="journal-list">
            {journalEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="journal-entry">
                <span className="mood">{entry.mood}</span>
                <p>{entry.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&family=Krub:wght@400;500&display=swap');

        :root {
          --bg: #F2C7C7;
          --card: #FFFFFF;
          --primary: #FFB7C5;
          --primary-hover: #F29CAD;
          --accent: #D5F3D8;
          --text: #1F1F1F;
          --muted: #6D6D6D;
          --border: #F2DADA;
        }

        body { background: var(--bg); font-family: 'Krub', sans-serif; }
        .page-shell { padding: 3rem 1.5rem; min-height: 100vh; }
        .center { display:flex; align-items:center; justify-content:center; }
        .container { max-width:1100px; margin:auto; }

        .card {
          background: var(--card);
          border:1px solid var(--border);
          border-radius:16px;
          padding:2rem;
          margin-bottom:2rem;
          box-shadow:0 10px 30px rgba(255, 183, 197, 0.25);
        }

        .brand-heading { font-family:'Inter', sans-serif; font-weight:600; letter-spacing:-0.02em; }
        .brand-heading.small { font-size:1.3rem; }
        .muted { color:var(--muted); font-size:0.9rem; }

        .profile { display:flex; align-items:center; gap:1.25rem; }
        .avatar { width:72px; height:72px; border-radius:50%; }

        .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
        .controls { display:flex; gap:0.5rem; flex-wrap:wrap; }

        .input { background:#FFFFFF; border:1px solid var(--border); border-radius:10px; padding:0.5rem 0.75rem; font-size:0.85rem; }
        .search-wrap { position:relative; }
        .icon { position:absolute; left:8px; top:50%; transform:translateY(-50%); width:14px; height:14px; color:var(--muted); }
        .search-wrap input { padding-left:28px; }

        .btn-primary { background:var(--primary); color:#1F1F1F; border:none; border-radius:10px; padding:0.5rem 1rem; font-size:0.85rem; cursor:pointer; }
        .btn-primary:hover { background:var(--primary-hover); }

        .btn-outline { background:transparent; border:1px solid var(--border); border-radius:10px; padding:0.5rem 0.8rem; font-size:0.8rem; cursor:pointer; }

        .tracks { display:flex; flex-direction:column; gap:0.75rem; }
        .track-card { border:1px solid var(--border); border-radius:12px; padding:0.9rem 1rem; background:white; }
        .track-title { font-weight:600; font-size:0.9rem; }
        .track-artist { font-size:0.8rem; color:var(--muted); }

        .links { margin-top:0.5rem; display:flex; gap:0.5rem; }
        .link-chip { border:1px solid var(--border); border-radius:999px; padding:0.2rem 0.6rem; font-size:0.7rem; text-decoration:none; color:var(--text); }
        .link-chip:hover { border-color:var(--primary); color:var(--primary); }

        .journal-input { display:grid; grid-template-columns: 1fr 2fr auto; gap:0.5rem; margin-bottom:1rem; }
        .journal-entry { border:1px solid var(--border); border-radius:12px; padding:0.75rem; background:white; }
        .mood { font-size:0.75rem; color:var(--primary); font-weight:600; }
      `}</style>
    </div>
  );
};

export default Home;