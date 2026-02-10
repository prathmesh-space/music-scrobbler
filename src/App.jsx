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



import { Loader2 } from 'lucide-react';

function App() {
  const { isLoggedIn, username, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        {isLoggedIn && <Navbar username={username} onLogout={logout} />}
        
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
