import { useEffect, useMemo, useState } from 'react';
import { getUserInfo, getRecentTracks } from '../services/lastfm';
import {
  Loader2,
  Search,
  ArrowDownAZ,
  ArrowUpZA,
  Save,
} from 'lucide-react';
import {
  buildSearchQuery,
  getSpotifySearchUrl,
  getYouTubeSearchUrl,
} from '../utils/musicLinks';
import { getLastFmImageUrl } from '../utils/lastfmImage.js';
import { getCachedData, setCachedData } from '../utils/cache';

const JOURNAL_KEY = 'music-scrobbler-session-journal';

const Home = ({ username }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(true);
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
      <div className="page-center">
        <Loader2 className="loader" />
      </div>
    );

  return (
    <div className="page">
      <div className="container">

        {/* PROFILE */}
        <div className="card profile-card">
          {userImage && (
            <img src={userImage} alt="Profile" className="avatar" />
          )}
          <div>
            <h1 className="heading-xl">
              {userInfo?.realname || userInfo?.name}
            </h1>
            <p className="muted">@{userInfo?.name}</p>
          </div>
        </div>

        {/* TRACKS */}
        <div className="card">
          <div className="section-header">
            <h2 className="heading-md">Recent Tracks</h2>

            <div className="controls">
              <div className="search">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search tracks"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button onClick={() => setSortBy('recent')} className="btn-ghost">
                Recent
              </button>

              <button
                onClick={() => setSortBy('track-asc')}
                className="btn-ghost"
              >
                <ArrowDownAZ size={14} /> A–Z
              </button>

              <button
                onClick={() => setSortBy('track-desc')}
                className="btn-ghost"
              >
                <ArrowUpZA size={14} /> Z–A
              </button>
            </div>
          </div>

          <div className="track-list">
            {filteredTracks.slice(0, 40).map((track, i) => {
              const artist =
                track.artist?.['#text'] || 'Unknown artist';

              const query = buildSearchQuery({
                type: 'track',
                name: track.name,
                artist,
              });

              return (
                <div key={i} className="track">
                  <div>
                    <p className="track-title">{track.name}</p>
                    <p className="track-artist">{artist}</p>
                  </div>

                  <div className="links">
                    <a
                      href={getSpotifySearchUrl(query)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Spotify
                    </a>
                    <a
                      href={getYouTubeSearchUrl(query)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      YouTube
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* JOURNAL */}
        <div className="card">
          <h2 className="heading-md">Session Journal</h2>

          <div className="journal-input">
            <select
              value={journalMood}
              onChange={(e) => setJournalMood(e.target.value)}
            >
              <option value="focused">Focused</option>
              <option value="energetic">Energetic</option>
              <option value="relaxed">Relaxed</option>
            </select>

            <input
              value={journalNote}
              onChange={(e) => setJournalNote(e.target.value)}
              placeholder="Write a note"
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap');

        :root {
          --bg: #FDF6EC;
          --card: #ffffff;
          --primary: #7A1E2C;
          --primary-hover: #5E1621;
          --text: #1F1F1F;
          --muted: #6D6D6D;
          --border: #E9E1D6;
        }

        * { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: Inter, sans-serif;
          background: var(--bg);
          color: var(--text);
        }

        .page {
          padding: 3rem 1.5rem;
          min-height: 100vh;
        }

        .page-center {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .container {
          max-width: 1000px;
          margin: auto;
        }

        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .profile-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
        }

        .heading-xl {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          margin: 0;
        }

        .heading-md {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          margin-bottom: 1rem;
        }

        .muted {
          color: var(--muted);
          font-size: 0.9rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .controls {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .search {
          position: relative;
        }

        .search input {
          padding: 0.5rem 0.75rem 0.5rem 2rem;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: #FAF6EF;
        }

        .search-icon {
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
        }

        .btn-primary {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          cursor: pointer;
        }

        .btn-primary:hover {
          background: var(--primary-hover);
        }

        .btn-ghost {
          border: 1px solid var(--border);
          background: transparent;
          padding: 0.5rem 0.8rem;
          border-radius: 10px;
          cursor: pointer;
        }

        .btn-ghost:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .track-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .track {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1rem;
          background: #fff;
        }

        .track-title {
          font-weight: 600;
          margin: 0;
        }

        .track-artist {
          font-size: 0.85rem;
          color: var(--muted);
          margin: 0.25rem 0 0;
        }

        .links a {
          margin-left: 0.75rem;
          font-size: 0.8rem;
          text-decoration: none;
          color: var(--text);
        }

        .links a:hover {
          color: var(--primary);
        }

        .journal-input {
          display: grid;
          grid-template-columns: 140px 1fr auto;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .journal-input input,
        .journal-input select {
          padding: 0.5rem 0.75rem;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: #FAF6EF;
        }

        .journal-entry {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          margin-bottom: 0.75rem;
          background: #fff;
        }

        .mood {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--primary);
        }

        .loader {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .journal-input {
            grid-template-columns: 1fr;
          }

          .track {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .links a {
            margin-left: 0;
            margin-right: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;