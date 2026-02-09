import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '../services/lastfm';
import { Loader2 } from 'lucide-react';

const Callback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Get token from URL query params
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setError('No authentication token received');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      try {
        // Exchange token for session
        await getSession(token);
        
        // Redirect to home page
        navigate('/');
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-400 text-xl mb-4">❌ {error}</div>
            <p className="text-gray-400">Redirecting to home page...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl text-white mb-2">Authenticating...</h2>
            <p className="text-gray-400">Please wait while we log you in</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Callback;
export { Callback };