import { useLocation, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';

const Navbar = ({ username }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Charts', path: '/charts' },
    { label: 'Recognize', path: '/recognition' },
    { label: 'Friends', path: '/friends' },
    { label: 'Discovery', path: '/discovery' },
  ];

  return (
    <header className="pill-navbar">
      <div className="pill-navbar-overlay">
        <nav className="pill-nav-content">
          <div className="pill-nav-buttons">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`pill-nav-button ${location.pathname === item.path ? 'pill-nav-button--active' : ''}`}
                aria-current={location.pathname === item.path ? 'page' : undefined}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            className="pill-profile-button"
            onClick={() => navigate('/profile')}
            aria-label="Profile"
            title={username}
          >
            <User size={32} />
          </button>
        </nav>
      </div>

      <style>{`
        .pill-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 1.25rem 2rem;
        }

        .pill-navbar-overlay {
          background: rgba(207, 208, 185, 0.35);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 100px;
          padding: 1.5rem 2.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .pill-nav-content {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          justify-content: space-between;
        }

        .pill-nav-buttons {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex: 1;
        }

        .pill-nav-button {
          padding: 1.5rem 3rem;
          border-radius: 59px;
          background: rgba(85, 73, 34, 0.9);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.25);
          border: none;
          color: #CFD0B9;
          font-family: 'Inter', sans-serif;
          font-size: 2rem;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .pill-nav-button:hover {
          background: rgba(107, 90, 43, 0.95);
          transform: translateY(-2px);
          box-shadow: 0 6px 8px 0 rgba(0, 0, 0, 0.3);
        }

        .pill-nav-button--active {
          background: rgba(107, 90, 43, 0.95);
          box-shadow: 0 6px 8px 0 rgba(0, 0, 0, 0.3);
        }

        .pill-profile-button {
          padding: 1.25rem;
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 2px solid rgba(255, 255, 255, 0.5);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.25);
          color: #999;
          flex-shrink: 0;
        }

        .pill-profile-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 8px 0 rgba(0, 0, 0, 0.3);
          background: rgba(255, 255, 255, 1);
        }

        @media (max-width: 1024px) {
          .pill-navbar {
            padding: 1rem 1.5rem;
          }

          .pill-navbar-overlay {
            padding: 1.25rem 2rem;
            border-radius: 80px;
          }

          .pill-nav-button {
            font-size: 1.75rem;
            padding: 1.25rem 2.5rem;
          }

          .pill-profile-button {
            width: 72px;
            height: 72px;
          }

          .pill-profile-button svg {
            width: 28px;
            height: 28px;
          }
        }

        @media (max-width: 768px) {
          .pill-navbar {
            padding: 0.875rem 1rem;
          }

          .pill-navbar-overlay {
            padding: 1rem 1.5rem;
            border-radius: 60px;
          }

          .pill-nav-content {
            gap: 1rem;
          }

          .pill-nav-buttons {
            gap: 0.75rem;
          }

          .pill-nav-button {
            font-size: 1.5rem;
            padding: 1rem 2rem;
          }

          .pill-profile-button {
            width: 64px;
            height: 64px;
          }

          .pill-profile-button svg {
            width: 26px;
            height: 26px;
          }
        }

        @media (max-width: 640px) {
          .pill-navbar {
            padding: 0.75rem 0.75rem;
          }

          .pill-navbar-overlay {
            padding: 0.875rem 1.25rem;
            border-radius: 50px;
          }

          .pill-nav-content {
            gap: 0.75rem;
          }

          .pill-nav-buttons {
            gap: 0.5rem;
            overflow-x: auto;
            flex: 1;
            padding-bottom: 0;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .pill-nav-buttons::-webkit-scrollbar {
            display: none;
          }

          .pill-nav-button {
            font-size: 1.25rem;
            padding: 0.875rem 1.75rem;
            flex-shrink: 0;
          }

          .pill-profile-button {
            width: 56px;
            height: 56px;
            flex-shrink: 0;
          }

          .pill-profile-button svg {
            width: 24px;
            height: 24px;
          }
        }

        @media (max-width: 480px) {
          .pill-navbar {
            padding: 0.625rem 0.5rem;
          }

          .pill-navbar-overlay {
            padding: 0.75rem 1rem;
            border-radius: 40px;
          }

          .pill-nav-content {
            gap: 0.5rem;
          }

          .pill-nav-buttons {
            gap: 0.375rem;
          }

          .pill-nav-button {
            font-size: 1.125rem;
            padding: 0.75rem 1.5rem;
          }

          .pill-profile-button {
            width: 50px;
            height: 50px;
          }

          .pill-profile-button svg {
            width: 22px;
            height: 22px;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
export { Navbar };