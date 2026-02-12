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
import { useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'music-scrobbler-theme';
const REDUCED_MOTION_KEY = 'music-scrobbler-reduced-motion';
const ONBOARDING_KEY = 'music-scrobbler-onboarding-completed';

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const resolveTheme = (theme) => {
  if (theme === 'system') return getSystemTheme();
  if (theme === 'sunset' || theme === 'midnight') return theme;
  return theme === 'light' ? 'light' : 'dark';
};

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
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'dark');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem(REDUCED_MOTION_KEY) === 'true');
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem(ONBOARDING_KEY) !== 'true');

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(REDUCED_MOTION_KEY, String(reducedMotion));
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';
  }, [reducedMotion]);

  useEffect(() => {
    if (theme !== 'system') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemThemeChange = () => {
      document.documentElement.dataset.theme = resolveTheme('system');
    };

    mediaQuery.addEventListener('change', onSystemThemeChange);

    return () => mediaQuery.removeEventListener('change', onSystemThemeChange);
  }, [theme]);

  const activeTheme = useMemo(() => resolveTheme(theme), [theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = activeTheme;
  }, [activeTheme]);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const appThemeClass =
    activeTheme === 'light'
      ? 'bg-gray-100 text-gray-900'
      : 'bg-gray-900 text-white';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${appThemeClass}`}>
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className={`min-h-screen transition-colors ${appThemeClass}`}>
        {isLoggedIn && (
          <Navbar
            username={username}
            onLogout={logout}
            theme={theme}
            onThemeChange={setTheme}
            activeTheme={activeTheme}
            reducedMotion={reducedMotion}
            onReducedMotionChange={setReducedMotion}
          />
        )}

        {isLoggedIn && showOnboarding ? (
          <div className="fixed inset-0 z-50 bg-black/60 px-4 py-10 backdrop-blur-sm">
            <div className="mx-auto max-w-2xl rounded-xl border border-purple-500/40 bg-gray-900 p-6 text-white">
              <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold"><Sparkles className="h-5 w-5 text-purple-300" /> Welcome to Music Scrobbler</h2>
              <ul className="mb-6 list-disc space-y-2 pl-5 text-sm text-gray-300">
                <li>Use <strong>Cmd/Ctrl+K</strong> to open the command palette and quickly jump pages.</li>
                <li>Try the new <strong>Dashboard</strong> page to customize your cards and layout.</li>
                <li>Visit <strong>Goals</strong> for streak milestones and celebration badges.</li>
              </ul>
              <button
                type="button"
                onClick={() => {
                  setShowOnboarding(false);
                  localStorage.setItem(ONBOARDING_KEY, 'true');
                }}
                className="rounded-md bg-purple-600 px-4 py-2 font-medium hover:bg-purple-500"
              >
                Got it
              </button>
            </div>
          </div>
        ) : null}

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

        {isLoggedIn && showBackToTop ? (
          <button
            type="button"
            aria-label="Scroll back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full border border-purple-500 bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-purple-500"
          >
            <ArrowUpCircle className="h-4 w-4" />
            Top
          </button>
        ) : null}
      </div>
    </Router>
  );
}

export default App;
