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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#D5F3D8] via-[#F2C7C7] to-[#FFB7C5]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
          <p className="font-['Krub'] text-white text-lg">Loading your music...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-[#F2C7C7] via-[#FFB7C5] to-[#D5F3D8]">

        {isLoggedIn && (
          <Navbar
            username={username}
            onLogout={logout}
          />
        )}

        {/* Main Content Surface */}
        <main className="mx-auto mt-6 mb-20 w-[95%] max-w-6xl rounded-3xl bg-white p-8 shadow-xl">

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
                        withUsername
                          ? <RouteComponent username={username} />
                          : <RouteComponent />
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

        {/* Onboarding Modal */}
        {isLoggedIn && showOnboarding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-6">
            <div className="w-full max-w-xl rounded-3xl bg-white p-10 shadow-2xl border-4 border-[#FFB7C5]">

              <div className="mb-6">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-full bg-gradient-to-br from-[#FFB7C5] to-[#F2C7C7]">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="font-['Inter'] text-3xl font-bold text-black">
                    Welcome to Music Scrobbler
                  </h2>
                </div>
                <p className="font-['Krub'] text-base text-black/60 mb-4">
                  Your personal music insights dashboard
                </p>
              </div>

              <ul className="font-['Krub'] text-base text-black/80 space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#FFB7C5] mt-2 flex-shrink-0" />
                  <span>Explore beautiful listening insights and track your music journey</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#D5F3D8] mt-2 flex-shrink-0" />
                  <span>Discover new music recommendations in Discovery Lab</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#F2C7C7] mt-2 flex-shrink-0" />
                  <span>Track listening streaks, goals & milestones</span>
                </li>
              </ul>

              <button
                onClick={() => {
                  setShowOnboarding(false);
                  localStorage.setItem(ONBOARDING_KEY, 'true');
                }}
                className="w-full rounded-full bg-gradient-to-r from-[#FFB7C5] to-[#F2C7C7] px-8 py-4 font-['Inter'] font-bold text-lg text-white transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                Get Started
              </button>
            </div>
          </div>
        )}

        {/* Back to Top */}
        {isLoggedIn && showBackToTop && (
          <button
            aria-label="Scroll back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-40 flex items-center gap-2 rounded-full bg-white border-2 border-[#FFB7C5] px-6 py-3 font-['Krub'] text-sm font-semibold text-black shadow-lg transition-all duration-300 hover:bg-[#FFB7C5] hover:text-white hover:scale-105"
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