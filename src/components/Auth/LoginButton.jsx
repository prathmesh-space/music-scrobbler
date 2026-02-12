import React from 'react';

const LoginButton = ({ onClick }) => {
  return (
    <div className="login-container">
      <div className="login-background" />
      <div className="login-content">
        <div className="login-card">
          <div className="logo-section">
            <div className="logo-icon"></div>
            <h1 className="login-title">Music Scrobbler</h1>
          </div>
          <p className="login-subtitle">Track your listening journey with Last.fm</p>
          <button
            onClick={onClick}
            className="login-button"
            aria-label="Login with Last.fm"
          >
            <span className="login-button-text">Login with Last.fm</span>
          </button>
          <div className="features">
            <div className="feature-item">
              <div className="feature-dot"></div>
              <span>Comprehensive tracking</span>
            </div>
            <div className="feature-item">
              <div className="feature-dot"></div>
              <span>Real-time analytics</span>
            </div>
            <div className="feature-item">
              <div className="feature-dot"></div>
              <span>Secure integration</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');

        :root {
          --color-primary: #2D3142;
          --color-secondary: #4F5D75;
          --color-accent: #EF8354;
          --color-light: #BFC0C0;
          --color-bg: #FFFFFF;
          --color-text-dark: #1A1A1A;
          --color-text-light: #6B6B6B;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .login-container {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .login-background {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(239, 131, 84, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(191, 192, 192, 0.08) 0%, transparent 50%);
          opacity: 0.6;
        }

        .login-content {
          position: relative;
          z-index: 10;
          padding: 2rem;
          width: 100%;
          max-width: 480px;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 3.5rem 3rem;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          transition: transform 0.3s ease;
        }

        .login-card:hover {
          transform: translateY(-4px);
        }

        .logo-section {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .logo-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 1.25rem;
          background: linear-gradient(135deg, var(--color-accent), #FF9A76);
          border-radius: 14px;
          position: relative;
          box-shadow: 0 8px 24px rgba(239, 131, 84, 0.25);
        }

        .logo-icon::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          box-shadow: 
            0 -8px 0 white,
            8px 0 0 white,
            0 8px 0 white;
        }

        .login-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--color-primary);
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .login-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          font-weight: 400;
          color: var(--color-text-light);
          margin-bottom: 2.5rem;
          text-align: center;
          line-height: 1.6;
        }

        .login-button {
          width: 100%;
          position: relative;
          background: linear-gradient(135deg, var(--color-accent) 0%, #FF9A76 100%);
          border: none;
          border-radius: 12px;
          padding: 16px 32px;
          cursor: pointer;
          box-shadow: 
            0 4px 12px rgba(239, 131, 84, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .login-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .login-button:hover::before {
          left: 100%;
        }

        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 20px rgba(239, 131, 84, 0.4),
            0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .login-button:active {
          transform: translateY(0);
          box-shadow: 
            0 2px 8px rgba(239, 131, 84, 0.3),
            0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .login-button-text {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: white;
          letter-spacing: 0.02em;
          position: relative;
          z-index: 1;
        }

        .features {
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(45, 49, 66, 0.08);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.875rem;
          font-size: 0.875rem;
          color: var(--color-text-light);
          font-weight: 400;
        }

        .feature-item:last-child {
          margin-bottom: 0;
        }

        .feature-dot {
          width: 6px;
          height: 6px;
          background: var(--color-accent);
          border-radius: 50%;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .login-content {
            padding: 1.5rem;
          }

          .login-card {
            padding: 3rem 2.25rem;
          }

          .login-title {
            font-size: 2rem;
          }

          .login-subtitle {
            font-size: 0.9375rem;
          }

          .login-button {
            padding: 15px 28px;
          }
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 2.5rem 1.75rem;
          }

          .logo-icon {
            width: 48px;
            height: 48px;
            margin-bottom: 1rem;
          }

          .logo-icon::before {
            width: 20px;
            height: 20px;
          }

          .login-title {
            font-size: 1.75rem;
          }

          .login-subtitle {
            font-size: 0.875rem;
            margin-bottom: 2rem;
          }

          .login-button {
            padding: 14px 24px;
          }

          .login-button-text {
            font-size: 14px;
          }

          .features {
            margin-top: 2rem;
            padding-top: 1.5rem;
          }

          .feature-item {
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginButton;