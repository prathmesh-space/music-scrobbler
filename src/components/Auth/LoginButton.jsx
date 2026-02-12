import React from 'react';

const LoginButton = ({ onClick }) => {
  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-card">
          <div className="logo-section">
            <div className="logo-icon" />
            <h1 className="login-title">Music Scrobbler</h1>
          </div>

          <p className="login-subtitle">
            Track your listening journey with Last.fm
          </p>

          <button
            onClick={onClick}
            className="login-button"
            aria-label="Login with Last.fm"
          >
            Login with Last.fm
          </button>

          <div className="features">
            <div className="feature-item">
              <span className="feature-dot" />
              <span>Comprehensive tracking</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot" />
              <span>Real-time analytics</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot" />
              <span>Secure integration</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap');

        :root {
          --bg-main: #FDF6EC;
          --card-bg: #FFFFFF;
          --primary: #7A1E2C;        /* deep cherry */
          --primary-hover: #5E1621;
          --text-main: #1F1F1F;
          --text-muted: #6D6D6D;
          --border-soft: #EEE6DA;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-main);
          font-family: 'Inter', sans-serif;
        }

        .login-content {
          width: 100%;
          max-width: 460px;
          padding: 2rem;
        }

        .login-card {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 3rem 2.75rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
          border: 1px solid var(--border-soft);
        }

        .logo-section {
          text-align: center;
          margin-bottom: 1.25rem;
        }

        .logo-icon {
          width: 52px;
          height: 52px;
          margin: 0 auto 1.25rem;
          background: var(--primary);
          border-radius: 12px;
        }

        .login-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.1rem;
          font-weight: 700;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          text-align: center;
          font-size: 0.95rem;
          color: var(--text-muted);
          margin-bottom: 2.25rem;
          line-height: 1.6;
        }

        .login-button {
          width: 100%;
          padding: 15px 24px;
          border-radius: 10px;
          border: none;
          background: var(--primary);
          color: #FFFFFF;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.25s ease, transform 0.15s ease;
        }

        .login-button:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
        }

        .login-button:active {
          transform: translateY(0);
        }

        .features {
          margin-top: 2.25rem;
          padding-top: 1.75rem;
          border-top: 1px solid var(--border-soft);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 0.75rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .feature-item:last-child {
          margin-bottom: 0;
        }

        .feature-dot {
          width: 6px;
          height: 6px;
          background: var(--primary);
          border-radius: 50%;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 2.5rem 2rem;
          }

          .login-title {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginButton;