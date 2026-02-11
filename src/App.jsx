import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import LoginButton from './components/Auth/LoginButton';
import { Navbar } from './components/Common/Navbar';
import Callback from './pages/Callback';
import Home from './pages/Home';
import Charts from './pages/Charts';
import Statistics from './pages/Statistics';
import Collage from './pages/Collage';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';
import Recognition from './pages/Recognition';
import ListeningGoals from './pages/ListeningGoals';
import DiscoveryLab from './pages/DiscoveryLab';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'music-scrobbler-theme';

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const resolveTheme = (theme) => (theme === 'system' ? getSystemTheme() : theme);

function App() {
  const { isLoggedIn, username, loading, login, logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'dark');

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

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

  const appThemeClass = activeTheme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-gray-900 text-white';

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
          <Navbar username={username} onLogout={logout} theme={theme} onThemeChange={setTheme} activeTheme={activeTheme} />
        )}
        
        <Routes>
          {/* Callback route (always accessible) */}
          <Route path="/callback" element={<Callback />} />

          {/* Protected routes */}
          {isLoggedIn ? (
            <>
              <Route path="/" element={<Home username={username} />} />
              <Route path="/charts" element={
                <Charts username={username} />
              } />
              <Route path="/statistics" element={<Statistics username={username} />} />
              <Route path="/collage" element={<Collage username={username} />} />
              <Route path="/friends" element={<Friends username={username} />} />
              <Route path="/profile" element={<Profile username={username} />} />
              <Route path="/recommendations" element={<Recommendations username={username} />} />
              <Route path="/recognition" element={<Recognition />} />
              <Route path="/goals" element={<ListeningGoals username={username} />} />
              <Route path="/discovery" element={<DiscoveryLab username={username} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            <>
              <Route path="/" element={<LoginButton onClick={login} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
