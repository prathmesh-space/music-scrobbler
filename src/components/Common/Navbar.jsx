import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Check, Command, LogOut, Menu, Search, Settings } from 'lucide-react';
import { navigationItems } from '../../config/routes';

const themeOptions = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'midnight', label: 'Midnight' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'system', label: 'System' },
];

const navLinkClasses = (isLight) => ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-purple-600 text-white'
      : isLight
        ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
        : 'text-gray-300 hover:text-white hover:bg-gray-700'
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

const Navbar = ({ username, onLogout, theme = 'dark', activeTheme = 'dark', onThemeChange, reducedMotion = false, onReducedMotionChange }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState('');

  const menuRef = useRef(null);
  const commandInputRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const isLight = activeTheme === 'light' || activeTheme === 'sunset';

  const container = isLight
    ? 'border-gray-200 bg-white/90 backdrop-blur'
    : 'border-gray-800 bg-gray-900/80 backdrop-blur';

  const userText = isLight ? 'text-gray-600' : 'text-gray-300';
  const userName = isLight ? 'text-gray-900' : 'text-white';

  const buttonBase = isLight
    ? 'border-gray-300 text-gray-700 hover:bg-gray-100'
    : 'border-purple-500 text-purple-200 hover:bg-purple-500 hover:text-white';

  const menuPanel = isLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-800';

  const menuItem = (selected) =>
    `flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition ${
      selected
        ? isLight
          ? 'bg-purple-50 text-purple-700'
          : 'bg-purple-600/30 text-purple-100'
        : isLight
          ? 'text-gray-700 hover:bg-gray-100'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

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
    const onKeydown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((previous) => !previous);
      }

      if (event.key === '[') {
        window.dispatchEvent(new CustomEvent('music-scrobbler:range', { detail: -1 }));
      }

      if (event.key === ']') {
        window.dispatchEvent(new CustomEvent('music-scrobbler:range', { detail: 1 }));
      }

      if (event.shiftKey && event.key.toLowerCase() === 't') {
        const order = ['dark', 'midnight', 'sunset', 'light', 'system'];
        const idx = order.indexOf(theme);
        onThemeChange?.(order[(idx + 1) % order.length]);
      }

      if (event.key === 'Escape') {
        setCommandOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [onThemeChange, theme]);

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

  const quickSuggestions = getStoredRecentRoutes()
    .map((path) => navigationItems.find((item) => item.path === path))
    .filter(Boolean);

  const filteredItems = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      return navigationItems;
    }

    return navigationItems.filter((item) =>
      [item.label, item.description, item.mobileLabel].some((value) =>
        value.toLowerCase().includes(cleanQuery),
      ),
    );
  }, [query]);

  const closeCommand = () => {
    setCommandOpen(false);
    setQuery('');
  };

  const goToRoute = (path) => {
    navigate(path);
    closeCommand();
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className={`sticky top-0 z-40 border-b transition-colors ${container}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-6">
            <Link to="/" className={`text-lg font-semibold ${userName}`}>
              Music Scrobbler
            </Link>

            <nav className="hidden space-x-2 lg:flex">
              {navigationItems.map((item, i) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={i === 0}
                  className={navLinkClasses(isLight)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              aria-label="Open mobile menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition lg:hidden ${buttonBase}`}
            >
              <Menu className="h-4 w-4" />
              Menu
            </button>

            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className={`hidden items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition md:inline-flex ${buttonBase}`}
            >
              <Search className="h-4 w-4" />
              Quick jump
              <span className={`rounded border px-1.5 py-0.5 text-xs ${isLight ? 'border-gray-300' : 'border-gray-500 text-gray-300'}`}>
                <Command className="h-3 w-3 inline" />K
              </span>
            </button>

            <span className={`hidden text-sm sm:block ${userText}`}>
              Signed in as <span className={`font-semibold ${userName}`}>{username}</span>
            </span>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${buttonBase}`}
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>

              {settingsOpen && (
                <div
                  className={`absolute right-0 top-12 z-50 w-56 rounded-md border p-2 shadow-lg ${menuPanel}`}
                >
                  <p className={`px-2 pb-1 text-xs font-semibold uppercase ${userText}`}>
                    Theme
                  </p>

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
                        className={menuItem(selected)}
                      >
                        {label}
                        {selected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => onReducedMotionChange?.(!reducedMotion)}
                    className={menuItem(false)}
                  >
                    Reduced motion
                    {reducedMotion ? <Check className="h-4 w-4" /> : null}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onLogout}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${buttonBase}`}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        <nav
          className={`border-t px-4 py-3 lg:hidden ${container} ${mobileMenuOpen ? 'block' : 'hidden'}`}
        >
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto pb-1">
            {navigationItems.map((item, i) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={i === 0}
                className={navLinkClasses(isLight)}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.mobileLabel}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      {commandOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 px-4 py-20 backdrop-blur-sm" onClick={closeCommand}>
          <div
            className={`mx-auto w-full max-w-2xl rounded-xl border p-4 shadow-xl ${menuPanel}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`mb-3 flex items-center gap-2 rounded-md border px-3 py-2 ${isLight ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-900'}`}>
              <Search className={`h-4 w-4 ${isLight ? 'text-gray-500' : 'text-gray-300'}`} />
              <input
                ref={commandInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages..."
                className={`w-full bg-transparent text-sm outline-none ${isLight ? 'text-gray-900 placeholder:text-gray-400' : 'text-gray-100 placeholder:text-gray-500'}`}
              />
            </div>

            <p className={`mb-3 text-xs ${userText}`}>Shortcuts: Cmd/Ctrl+K command palette • Shift+T cycle themes • [ / ] switch range</p>

            {!query && quickSuggestions.length > 0 ? (
              <div className="mb-4">
                <p className={`mb-2 text-xs font-semibold uppercase ${userText}`}>Recent pages</p>
                <div className="flex flex-wrap gap-2">
                  {quickSuggestions.map((item) => (
                    <button
                      key={`recent-${item.path}`}
                      type="button"
                      onClick={() => goToRoute(item.path)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${isLight ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : 'border-gray-600 text-gray-200 hover:bg-gray-700'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {filteredItems.length === 0 ? (
                <p className={`rounded-md border px-3 py-4 text-sm ${isLight ? 'border-gray-200 text-gray-500' : 'border-gray-700 text-gray-400'}`}>
                  No pages found for “{query}”.
                </p>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => goToRoute(item.path)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                      location.pathname === item.path
                        ? isLight
                          ? 'border-purple-200 bg-purple-50 text-purple-800'
                          : 'border-purple-500/60 bg-purple-500/20 text-purple-100'
                        : isLight
                          ? 'border-gray-200 text-gray-700 hover:bg-gray-100'
                          : 'border-gray-700 text-gray-200 hover:bg-gray-700'
                    }`}
                  >
                    <p className="font-medium">{item.label}</p>
                    <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{item.description}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
export { Navbar };
