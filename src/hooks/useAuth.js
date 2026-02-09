import { useCallback, useEffect, useState } from 'react';
import { getAuthUrl, getUsername, isAuthenticated, logout } from '../services/lastfm';

const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncAuthState = useCallback(() => {
    const authenticated = isAuthenticated();
    setIsLoggedIn(authenticated);
    setUsername(authenticated ? getUsername() : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    syncAuthState();

    const handleStorage = (event) => {
      if (event.key === 'lastfm_session_token' || event.key === 'lastfm_username') {
        syncAuthState();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncAuthState]);

  const login = useCallback(() => {
    window.location.href = getAuthUrl();
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setIsLoggedIn(false);
    setUsername(null);
  }, []);

  return {
    isLoggedIn,
    username,
    loading,
    login,
    logout: handleLogout,
  };
};
export { useAuth };
export default useAuth;
