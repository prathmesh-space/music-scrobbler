import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import LoginButton from './components/Auth/LoginButton';
import { Navbar } from './components/Common/Navbar';
import {
  Callback,
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

const ONBOARDING_KEY = 'music-scrobbler-onboarding-completed';

const pageComponents = {
  Home,
  Charts,
  Statistics,
  Collage,
  Friends,
  Profile,
  Recommendations,
  ListeningGoals,
  DiscoveryLab,
  Recognition: SongRecognition,
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
      <div className="app-loading-shell">
        <div className="app-loading-content">
          <Loader2 className="app-loading-icon" />
          <p className="app-loading-text">Loading your music...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-shell">
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
                      element={withUsername ? <RouteComponent username={username} /> : <RouteComponent />}
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
          <div className="app-modal-overlay">
            <div className="app-modal-card">
              <div className="app-modal-header">
                <div className="app-modal-icon">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="app-modal-title">Welcome to Music Scrobbler</h2>
                  <p className="app-modal-subtitle">Your personal music insights dashboard</p>
                </div>
              </div>

              <ul className="app-modal-list">
                <li>Explore your listening insights and track your music journey.</li>
                <li>Discover recommendations and hidden gems in Discovery Lab.</li>
                <li>Track streaks, goals, milestones, and daily listening rituals.</li>
              </ul>

              <button
                onClick={() => {
                  setShowOnboarding(false);
                  localStorage.setItem(ONBOARDING_KEY, 'true');
                }}
                className="app-primary-button"
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
            className="app-back-to-top"
          >
            <ArrowUpCircle className="h-5 w-5" />
            Back to Top
          </button>
        )}
      </div>
    </Router>
  );
}

export default App;
