import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import LoginButton from './components/Auth/LoginButton';
import { Navbar } from './components/Common/Navbar';
import {
  Callback,
  ChartAlbums,
  ChartArtists,
  ChartTracks,
  Charts,
  Collage,
  DiscoveryLab,
  Friends,
  Home,
  ListeningGoals,
  Profile,
  Recommendations,
  Statistics,
} from './pages';
import SongRecognition from './pages/SongRecognition';
import { authenticatedRoutes } from './config/routes';
import { ArrowUpCircle, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import './App.css';

// Import your background image
// If this doesn't work, move the image to public/assets/background.jpg
// and use: '/assets/background.jpg' in the backgroundImage below
import backgroundImg from './assets/background.jpg'; // Adjust path as needed

const ONBOARDING_KEY = 'music-scrobbler-onboarding-completed';

const pageComponents = {
  Home,
  Charts,
  ChartArtists,
  ChartAlbums,
  ChartTracks,
  Statistics,
  Collage,
  Friends,
  Profile,
  Recommendations,
  ListeningGoals,
  DiscoveryLab,
  Recognition: SongRecognition,
};

// Inline styles as fallback - these will DEFINITELY work
const backgroundContainerStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100vw',
  height: '100vh',
  zIndex: -1,
  overflow: 'hidden',
  pointerEvents: 'none'
};

const backgroundImageStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundImage: `url(${backgroundImg})`, // or use: url('/assets/background.jpg')
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
};

const backgroundOverlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(to bottom, rgba(207, 208, 185, 0.15) 0%, rgba(207, 208, 185, 0.25) 50%, rgba(207, 208, 185, 0.35) 100%)',
  backdropFilter: 'blur(0.5px)'
};

function App() {
  const { isLoggedIn, username, loading, login, logout } = useAuth();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) !== 'true'
  );

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) {
    return (
      <div className="loading-shell">
        <div className="loading-container">
          <div className="loading-spinner">
            <Loader2 className="loading-icon" />
          </div>
          <p className="loading-text">Tuning in to your music...</p>
          <p className="loading-subtext">Just a moment</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-shell">
        {/* Background Image Layer with INLINE STYLES (guaranteed to work) */}
        <div style={backgroundContainerStyle}>
          <div style={backgroundImageStyle} />
          <div style={backgroundOverlayStyle} />
        </div>

        {/* Glow effects */}
        <div className="app-shell-glow app-shell-glow--left" />
        <div className="app-shell-glow app-shell-glow--right" />

        {isLoggedIn && <Navbar username={username} onLogout={logout} />}

        <main className="app-main-surface">
          <Routes>
            <Route path="/callback" element={<Callback />} />

            {isLoggedIn ? (
              <>
                {authenticatedRoutes.map(({ path, pageKey, withUsername }) => {
                  const RouteComponent = pageComponents[pageKey];
                  return (
                    <Route
                      key={path}
                      path={path}
                      element={
                        withUsername ? (
                          <RouteComponent username={username} />
                        ) : (
                          <RouteComponent />
                        )
                      }
                    />
                  );
                })}
                <Route path="*" element={<Navigate to="/" />} />
              </>
            ) : (
              <>
                <Route path="/" element={<LoginButton onClick={login} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </main>

        {isLoggedIn && showOnboarding && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <div className="modal-icon-wrapper">
                  <Sparkles className="modal-icon" />
                </div>
                <div className="modal-header-text">
                  <h2 className="modal-title">Welcome to Music Scrobbler</h2>
                  <p className="modal-subtitle">Your personal music insights dashboard</p>
                </div>
              </div>

              <ul className="modal-list">
                <li className="modal-list-item">
                  <span className="modal-list-dot" />
                  Explore your listening insights and track your music journey
                </li>
                <li className="modal-list-item">
                  <span className="modal-list-dot" />
                  Discover recommendations and hidden gems in Discovery Lab
                </li>
                <li className="modal-list-item">
                  <span className="modal-list-dot" />
                  Track streaks, goals, milestones, and daily listening rituals
                </li>
              </ul>

              <button
                onClick={() => {
                  setShowOnboarding(false);
                  localStorage.setItem(ONBOARDING_KEY, 'true');
                }}
                className="primary-button modal-button"
              >
                Get Started
              </button>
            </div>
          </div>
        )}

        {isLoggedIn && showBackToTop && (
          <button
            aria-label="Scroll back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="back-to-top-button"
          >
            <ArrowUpCircle className="back-to-top-icon" />
            <span>Back to Top</span>
          </button>
        )}
      </div>
    </Router>
  );
}

export default App;