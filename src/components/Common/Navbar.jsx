import { useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
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
      
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#FFFFFF',
        borderBottom: '2px solid #FFB7C5',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1rem 1.5rem'
        }}>
          
          {/* Top Bar: Logo and User */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <Link
              to="/"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '1.875rem',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: '#000000',
                textDecoration: 'none',
                transition: 'color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#FFB7C5'}
              onMouseLeave={(e) => e.target.style.color = '#000000'}
            >
              Music Scrobbler
            </Link>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              {username && (
                <span style={{
                  fontFamily: 'Krub, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'rgba(0, 0, 0, 0.6)'
                }}>
                  @{username}
                </span>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: '#000000',
                    padding: '0.625rem 1.25rem',
                    fontFamily: 'Krub, sans-serif',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#000000'}
                >
                  <LogOut style={{ height: '14px', width: '14px' }} />
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Navigation Bar */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}>
            {navigationItems.map((item, i) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={i === 0}
                style={({ isActive }) => ({
                  flexShrink: 0,
                  fontFamily: 'Krub, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: '0.025em',
                  transition: 'all 0.3s',
                  borderRadius: '9999px',
                  padding: '0.625rem 1.25rem',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  backgroundColor: isActive ? '#FFB7C5' : '#F2C7C7',
                  color: isActive ? '#ffffff' : 'rgba(0, 0, 0, 0.7)'
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.backgroundColor = '#D5F3D8';
                    e.currentTarget.style.color = '#000000';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.backgroundColor = '#F2C7C7';
                    e.currentTarget.style.color = 'rgba(0, 0, 0, 0.7)';
                  }
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

        </div>

        <style>{`
          nav::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </header>
    </>
  );
};

export default Navbar;
export { Navbar };