import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Check, LogOut, Settings } from 'lucide-react';

const navLinkClasses = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
  }`;

const themeOptions = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' }
];

const Navbar = ({ username, onLogout, theme = 'dark', onThemeChange, activeTheme = 'dark' }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsMenuRef = useRef(null);

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (!settingsMenuRef.current?.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

  const isLightTheme = activeTheme === 'light';
  const containerClass = isLightTheme ? 'border-gray-200 bg-white' : 'border-gray-800 bg-gray-900';
  const userTextClass = isLightTheme ? 'text-gray-600' : 'text-gray-300';
  const userNameClass = isLightTheme ? 'text-gray-900' : 'text-white';
  const iconButtonClass = isLightTheme
    ? 'border-gray-300 text-gray-700 hover:bg-gray-100'
    : 'border-purple-500 text-purple-200 hover:bg-purple-500 hover:text-white';
  const menuPanelClass = isLightTheme ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-800';
  const menuItemClass = (selected) =>
    `flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
      selected
        ? isLightTheme
          ? 'bg-purple-50 text-purple-700'
          : 'bg-purple-600/30 text-purple-100'
        : isLightTheme
          ? 'text-gray-700 hover:bg-gray-100'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <header className={`border-b transition-colors ${containerClass}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center space-x-6">
          <Link to="/" className={`text-lg font-semibold ${userNameClass}`}>
            Music Scrobbler
          </Link>
          <nav className="hidden items-center space-x-2 md:flex">
            <NavLink to="/" className={navLinkClasses} end>
              Home
            </NavLink>
            <NavLink to="/charts" className={navLinkClasses}>
              Charts
            </NavLink>
            <NavLink to="/statistics" className={navLinkClasses}>
              Statistics
            </NavLink>
            <NavLink to="/collage" className={navLinkClasses}>
              Collage
            </NavLink>
            <NavLink to="/friends" className={navLinkClasses}>
              Friends
            </NavLink>
            <NavLink to="/profile" className={navLinkClasses}>
              Profile
            </NavLink>
            <NavLink to="/recommendations" className={navLinkClasses}>
              Recommendations
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`hidden text-sm sm:block ${userTextClass}`}>
            Signed in as <span className={`font-semibold ${userNameClass}`}>{username}</span>
          </span>
          <div className="relative" ref={settingsMenuRef}>
            <button
              type="button"
              onClick={() => setIsSettingsOpen((open) => !open)}
              className={`inline-flex items-center space-x-2 rounded-md border px-3 py-2 text-sm font-medium transition ${iconButtonClass}`}
              aria-expanded={isSettingsOpen}
              aria-haspopup="menu"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
            {isSettingsOpen && (
              <div
                role="menu"
                aria-label="Theme options"
                className={`absolute right-0 top-12 z-50 w-44 rounded-md border p-2 shadow-lg ${menuPanelClass}`}
              >
                <p className={`px-2 pb-1 text-xs font-semibold uppercase tracking-wide ${userTextClass}`}>
                  Theme
                </p>
                {themeOptions.map((option) => {
                  const selected = option.value === theme;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      onClick={() => {
                        onThemeChange?.(option.value);
                        setIsSettingsOpen(false);
                      }}
                      className={menuItemClass(selected)}
                    >
                      <span>{option.label}</span>
                      {selected && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className={`inline-flex items-center space-x-2 rounded-md border px-3 py-2 text-sm font-medium transition ${iconButtonClass}`}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      <nav className={`flex items-center justify-center space-x-2 border-t px-4 py-3 md:hidden ${containerClass}`}>
        <NavLink to="/" className={navLinkClasses} end>
          Home
        </NavLink>
        <NavLink to="/charts" className={navLinkClasses}>
          Charts
        </NavLink>
        <NavLink to="/statistics" className={navLinkClasses}>
          Statistics
        </NavLink>
        <NavLink to="/collage" className={navLinkClasses}>
          Collage
        </NavLink>
        <NavLink to="/friends" className={navLinkClasses}>
          Friends
        </NavLink>
        <NavLink to="/profile" className={navLinkClasses}>
          Profile
        </NavLink>
        <NavLink to="/recommendations" className={navLinkClasses}>
          Recs
        </NavLink>
      </nav>
    </header>
  );
};

export { Navbar };
export default Navbar;
