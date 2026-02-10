import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Check, LogOut, Menu, Settings } from 'lucide-react';

/* -------------------- helpers -------------------- */

const themeOptions = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
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

/* -------------------- component -------------------- */

const Navbar = ({
  username,
  onLogout,
  theme = 'dark',
  activeTheme = 'dark',
  onThemeChange,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isLight = activeTheme === 'light';

  /* -------------------- styles -------------------- */

  const container = isLight
    ? 'border-gray-200 bg-white/90 backdrop-blur'
    : 'border-gray-800 bg-gray-900/80 backdrop-blur';

  const userText = isLight ? 'text-gray-600' : 'text-gray-300';
  const userName = isLight ? 'text-gray-900' : 'text-white';

  const buttonBase = isLight
    ? 'border-gray-300 text-gray-700 hover:bg-gray-100'
    : 'border-purple-500 text-purple-200 hover:bg-purple-500 hover:text-white';

  const menuPanel = isLight
    ? 'border-gray-200 bg-white'
    : 'border-gray-700 bg-gray-800';

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

  /* -------------------- effects -------------------- */

  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (!menuRef.current?.contains(e.target)) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  /* -------------------- render -------------------- */

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors ${container}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Logo + desktop nav */}
        <div className="flex items-center space-x-6">
          <Link to="/" className={`text-lg font-semibold ${userName}`}>
            Music Scrobbler
          </Link>

          <nav className="hidden space-x-2 lg:flex">
            {['/', '/charts', '/statistics', '/collage', '/friends', '/profile', '/recommendations', '/recognition'].map(
              (path, i) => (
                <NavLink
                  key={path}
                  to={path}
                  end={i === 0}
                  className={navLinkClasses(isLight)}
                >
                  {['Home', 'Charts', 'Statistics', 'Collage', 'Friends', 'Profile', 'Recommendations', 'Recognition'][i]}
                </NavLink>
              )
            )}
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition lg:hidden ${buttonBase}`}
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>

          <span className={`hidden text-sm sm:block ${userText}`}>
            Signed in as <span className={`font-semibold ${userName}`}>{username}</span>
          </span>

          {/* Settings */}
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
                className={`absolute right-0 top-12 z-50 w-44 rounded-md border p-2 shadow-lg ${menuPanel}`}
              >
                <p className={`px-2 pb-1 text-xs font-semibold uppercase ${userText}`}>
                  Theme
                </p>

                {themeOptions.map(({ value, label }) => {
                  const selected = value === theme;

                  return (
                    <button
                      key={value}
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
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${buttonBase}`}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav
        className={`border-t px-4 py-3 lg:hidden ${container} ${mobileMenuOpen ? 'block' : 'hidden'}`}
      >
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto pb-1">
          {['/', '/charts', '/statistics', '/collage', '/friends', '/profile', '/recommendations', '/recognition'].map(
            (path, i) => (
              <NavLink
                key={path}
                to={path}
                end={i === 0}
                className={navLinkClasses(isLight)}
                onClick={() => setMobileMenuOpen(false)}
              >
                {['Home', 'Charts', 'Stats', 'Collage', 'Friends', 'Profile', 'Recs', 'Recognize'][i]}
              </NavLink>
            )
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
export { Navbar };
