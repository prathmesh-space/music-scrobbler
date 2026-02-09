import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import LoginButton from './components/Auth/LoginButton';
import { Navbar } from './components/Common/Navbar';
import Callback from './pages/Callback';
import Home from './pages/Home';
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
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                  <h1 className="text-3xl text-white">Charts - Coming Soon</h1>
                </div>
              } />
              <Route path="/statistics" element={
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                  <h1 className="text-3xl text-white">Statistics - Coming Soon</h1>
                </div>
              } />
              <Route path="/collage" element={
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                  <h1 className="text-3xl text-white">Collage Generator - Coming Soon</h1>
                </div>
              } />
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