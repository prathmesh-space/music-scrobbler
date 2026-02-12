import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Check, Command, LogOut, Search, Settings } from 'lucide-react';
import { navigationItems } from '../../config/routes';

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

const navLinkClasses = ({ isActive }) =>
  `font-['Krub'] rounded-full px-4 py-2 text-sm transition-all duration-200 whitespace-nowrap ${
    isActive
      ? 'bg-[#FFB7C5] text-black font-semibold shadow-md'
      : 'text-black/70 hover:bg-[#F2C7C7] hover:text-black'
  }`;

const RECENT_ROUTES_KEY = 'music-scrobbler-recent-routes';

const getStoredRecentRoutes = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_ROUTES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const Navbar = ({ username, onLogout, theme = 'light', onThemeChange }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState('');

  const menuRef = useRef(null);
  const commandInputRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (!menuRef.current?.contains(e.target)) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const matchedRoute = navigationItems.find((item) => item.path === location.pathname);
    if (!matchedRoute) return;

    const previous = getStoredRecentRoutes();
    const next = [matchedRoute.path, ...previous.filter((path) => path !== matchedRoute.path)].slice(0, 4);
    localStorage.setItem(RECENT_ROUTES_KEY, JSON.stringify(next));
  }, [location.pathname]);

  useEffect(() => {
    if (commandOpen) {
      requestAnimationFrame(() => {
        commandInputRef.current?.focus();
      });
    }
  }, [commandOpen]);

  const filteredItems = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return navigationItems;

    return navigationItems.filter((item) =>
      [item.label, item.description, item.mobileLabel]
        .join(' ')
        .toLowerCase()
        .includes(cleanQuery),
    );
  }, [query]);

  const closeCommand = () => {
    setCommandOpen(false);
    setQuery('');
  };

  const goToRoute = (path) => {
    navigate(path);
    closeCommand();
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#F2DADA] bg-[#F2C7C7]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          
          {/* Logo */}
          <Link
            to="/"
            className="font-['Inter'] text-xl font-semibold tracking-tight text-black hover:text-[#FFB7C5] transition"
          >
            Music Scrobbler
          </Link>

          {/* Tabs (Always Visible) */}
          <nav className="flex flex-1 justify-center gap-2 overflow-x-auto px-6">
            {navigationItems.map((item, i) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={i === 0}
                className={navLinkClasses}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[#F2DADA] px-4 py-2 text-sm font-['Krub'] hover:bg-[#FFB7C5] transition"
            >
              <Search className="h-4 w-4" />
              Quick jump
              <span className="rounded border border-[#F2DADA] px-2 py-0.5 text-xs">
                <Command className="h-3 w-3 inline" />K
              </span>
            </button>

            <span className="hidden sm:block text-sm font-['Krub'] text-black/70">
              <span className="font-semibold text-black">{username}</span>
            </span>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-[#F2DADA] px-4 py-2 text-sm font-['Krub'] hover:bg-[#FFB7C5] transition"
              >
                <Settings className="h-4 w-4" />
              </button>

              {settingsOpen && (
                <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-[#F2DADA] bg-white p-3 shadow-xl">
                  <p className="px-2 pb-2 text-xs font-semibold uppercase text-black/60">Theme</p>
                  {themeOptions.map(({ value, label }) => {
                    const selected = value === theme;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          onThemeChange?.(value);
                          setSettingsOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-['Krub'] transition ${
                          selected ? 'bg-[#FFB7C5]' : 'hover:bg-[#F2C7C7]'
                        }`}
                      >
                        {label}
                        {selected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full border border-[#F2DADA] px-4 py-2 text-sm font-['Krub'] hover:bg-[#FFB7C5] transition"
            >
              <LogOut className="h-4 w-4" />
            </button>

          </div>
        </div>
      </header>

      {/* Command Modal */}
      {commandOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm px-4 py-20" onClick={closeCommand}>
          <div
            className="mx-auto w-full max-w-2xl rounded-3xl border border-[#F2DADA] bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-2 rounded-full border border-[#F2DADA] px-4 py-2">
              <Search className="h-4 w-4 text-black/50" />
              <input
                ref={commandInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages..."
                className="w-full bg-transparent text-sm font-['Krub'] outline-none"
              />
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto">
              {filteredItems.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => goToRoute(item.path)}
                  className="w-full rounded-2xl border border-[#F2DADA] px-4 py-3 text-left font-['Krub'] transition hover:bg-[#F2C7C7]"
                >
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-black/60">{item.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
export { Navbar };