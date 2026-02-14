import { useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { LogOut, Menu, Search } from 'lucide-react';
import { navigationItems } from '../../config/routes';

const RECENT_ROUTES_KEY = 'music-scrobbler-recent-routes';

const getStoredRecentRoutes = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_ROUTES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const Navbar = ({ username, onLogout }) => {
  const location = useLocation();

  useEffect(() => {
    const matchedRoute = navigationItems.find((item) => item.path === location.pathname);
    if (!matchedRoute) return;

    const previous = getStoredRecentRoutes();
    const next = [matchedRoute.path, ...previous.filter((path) => path !== matchedRoute.path)].slice(0, 4);
    localStorage.setItem(RECENT_ROUTES_KEY, JSON.stringify(next));
  }, [location.pathname]);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Krub:wght@400;500;600&display=swap" rel="stylesheet" />

      <header className="navbar-header">
        <div className="navbar-container">

          {/* Top Bar: Logo and User */}
          <div className="navbar-top-bar">
            <Link to="/" className="navbar-logo">
              Music Scrobbler
            </Link>

            <div className="navbar-user-section">
              {username && (
                <span className="navbar-username">
                  @ {username}
                </span>
              )}
              {onLogout && (
                <button onClick={onLogout} className="navbar-logout-btn">
                  <LogOut className="navbar-logout-icon" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>

          {/* Glass Navigation Bar */}
          <nav className="navbar-glass-container">
            <button className="navbar-sidebar-btn" aria-label="Menu">
              <Menu size={20} strokeWidth={2} />
            </button>

            <div className="navbar-tabs-wrapper">
              {navigationItems.map((item, i) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={i === 0}
                  className={({ isActive }) =>
                    isActive ? 'navbar-tab navbar-tab-active' : 'navbar-tab'
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <button className="navbar-search-btn" aria-label="Search">
              <Search size={20} strokeWidth={2} />
            </button>
          </nav>

        </div>

        <style>{`
          .navbar-header {
            position: sticky;
            top: 0;
            z-index: 50;
            background: #FFFFFF;
            box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.25);
            backdrop-filter: blur(2px);
          }

          .navbar-container {
            max-width: 95rem;
            margin: 0 auto;
            padding: 1.5rem 2.5rem;
          }

          .navbar-top-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.75rem;
          }

          .navbar-logo {
            font-family: 'Inter', -apple-system, sans-serif;
            font-size: 3rem;
            font-weight: 800;
            line-height: 2.8125rem;
            letter-spacing: -0.046875rem;
            color: #000000;
            text-decoration: none;
            transition: opacity 0.3s;
          }

          .navbar-logo:hover {
            opacity: 0.8;
          }

          .navbar-user-section {
            display: flex;
            align-items: center;
            gap: 1.5rem;
          }

          .navbar-username {
            font-family: 'Krub', -apple-system, sans-serif;
            font-size: 0.875rem;
            font-weight: 500;
            line-height: 1.3125rem;
            color: rgba(0, 0, 0, 0.6);
          }

          .navbar-logout-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: transparent;
            border: none;
            cursor: pointer;
            transition: opacity 0.3s;
          }

          .navbar-logout-btn:hover {
            opacity: 0.7;
          }

          .navbar-logout-btn span {
            font-family: 'Krub', -apple-system, sans-serif;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.0375rem;
            color: #FFFFFF;
          }

          .navbar-logout-icon {
            width: 1rem;
            height: 1rem;
            stroke: #FFFFFF;
          }

          .navbar-glass-container {
            display: flex;
            align-items: center;
            padding: 0.25rem;
            background: linear-gradient(0deg, #F7F7F7 0%, #F7F7F7 100%),
                        linear-gradient(0deg, rgba(255, 255, 255, 0.50) 0%, rgba(255, 255, 255, 0.50) 100%);
            border-radius: 18.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            overflow-x: auto;
            scrollbar-width: none;
          }

          .navbar-glass-container::-webkit-scrollbar {
            display: none;
          }

          .navbar-sidebar-btn,
          .navbar-search-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            width: 3.375rem;
            padding: 0.5rem 1rem;
            background: transparent;
            border: none;
            cursor: pointer;
            color: #1A1A1A;
            transition: opacity 0.3s;
          }

          .navbar-sidebar-btn:hover,
          .navbar-search-btn:hover {
            opacity: 0.6;
          }

          .navbar-tabs-wrapper {
            display: flex;
            align-items: center;
            flex: 1;
            gap: 0.25rem;
            padding: 0 0.5rem;
          }

          .navbar-tab {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem 1.125rem;
            font-family: -apple-system, 'SF Pro', 'Segoe UI', sans-serif;
            font-size: 0.9375rem;
            font-weight: 510;
            line-height: 1.25rem;
            letter-spacing: -0.014375rem;
            color: #1A1A1A;
            text-decoration: none;
            white-space: nowrap;
            border-radius: 6.25rem;
            transition: all 0.3s;
            flex-shrink: 0;
          }

          .navbar-tab:hover:not(.navbar-tab-active) {
            background: rgba(0, 0, 0, 0.04);
          }

          .navbar-tab-active {
            background: #EDEDED;
          }

          @media (max-width: 1024px) {
            .navbar-container {
              padding: 1.25rem 1.5rem;
            }

            .navbar-logo {
              font-size: 2rem;
              line-height: 2rem;
            }

            .navbar-glass-container {
              overflow-x: auto;
            }
          }

          @media (max-width: 768px) {
            .navbar-container {
              padding: 1rem 1rem;
            }

            .navbar-logo {
              font-size: 1.5rem;
              line-height: 1.5rem;
            }

            .navbar-username {
              display: none;
            }

            .navbar-logout-btn span {
              display: none;
            }

            .navbar-tab {
              font-size: 0.875rem;
              padding: 0.5rem 1rem;
            }
          }
        `}</style>
      </header>
    </>
  );
};

export default Navbar;
export { Navbar };
