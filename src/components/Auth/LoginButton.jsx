import React from 'react';
import { Music } from 'lucide-react';

const LoginButton = ({ onClick }) => {
  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-icon-section">
            <div className="auth-icon-wrapper">
              <Music className="auth-icon" />
            </div>
          </div>

          <h1 className="auth-title">Music Scrobbler</h1>
          <p className="auth-subtitle">
            Discover your musical story with insightful analytics
          </p>

          <button
            onClick={onClick}
            className="auth-login-button"
            aria-label="Login with Last.fm"
          >
            Login with Last.fm
          </button>

          <div className="auth-divider" />

          <ul className="auth-features-list">
            <li className="auth-feature">
              <span className="auth-feature-text">Track your listening habits</span>
            </li>
            <li className="auth-feature">
              <span className="auth-feature-text">Real-time music insights</span>
            </li>
            <li className="auth-feature">
              <span className="auth-feature-text">Secure & private</span>
            </li>
          </ul>
        </div>

        <p className="auth-footer">Powered by Last.fm API</p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Krub:wght@400;500;600;700&display=swap');

        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #FFF8F6 0%, #FFE5D9 50%, #E0F5F0 100%);
          font-family: 'Krub', sans-serif;
        }

        .auth-wrapper {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .auth-card {
          background: #FFFFFF;
          border-radius: 1.75rem;
          padding: 2.5rem 2rem;
          box-shadow: 0 10px 40px rgba(255, 183, 220, 0.15), 0 0 0 1px rgba(245, 232, 232, 0.8);
          animation: fade-in-up 0.6s ease;
        }

        .auth-icon-section {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .auth-icon-wrapper {
          width: 72px;
          height: 72px;
          margin: 0 auto;
          background: linear-gradient(135deg, #FFD1DC 0%, #E0F5F0 100%);
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(255, 183, 220, 0.25);
        }

        .auth-icon {
          width: 40px;
          height: 40px;
          color: #2D2D2D;
        }

        .auth-title {
          font-family: 'Inter', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
          color: #2D2D2D;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }

        .auth-subtitle {
          text-align: center;
          font-size: 0.95rem;
          color: #888888;
          margin: 0 0 2rem 0;
          line-height: 1.6;
        }

        .auth-login-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 1rem 1.5rem;
          border-radius: 0.875rem;
          border: none;
          background: linear-gradient(135deg, #FFD1DC 0%, #FFC5D0 100%);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          font-family: 'Krub', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(255, 183, 220, 0.3);
        }

        .auth-login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(255, 183, 220, 0.4);
        }

        .auth-login-button:active {
          transform: translateY(0);
        }

        .auth-divider {
          height: 1px;
          background: #F5E8E8;
          margin: 1.5rem 0;
        }

        .auth-features-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .auth-feature {
          display: flex;
          align-items: center;
          font-size: 0.9rem;
          color: #2D2D2D;
          line-height: 1.5;
        }

        .auth-feature-text {
          font-weight: 500;
        }

        .auth-footer {
          text-align: center;
          font-size: 0.8rem;
          color: #888888;
          margin: 0;
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 2rem 1.5rem;
          }

          .auth-title {
            font-size: 1.75rem;
          }

          .auth-subtitle {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginButton;
