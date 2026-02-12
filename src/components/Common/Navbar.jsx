import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Command, LogOut, Search } from 'lucide-react';
import { navigationItems } from '../../config/routes';

const navLinkClasses = ({ isActive }) =>
  `font-['Inter'] text-base tracking-wide transition-all duration-200 whitespace-nowrap px-6 py-3 rounded-full ${
    isActive
      ? 'bg-[#FDF6EC] text-black font-bold'
      : 'text-[#FDF6EC]/85 hover:font-bold hover:text-[#FDF6EC]'
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

const Navbar = ({ username, onLogout }) => {
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState('');
  const commandInputRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

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
      <header className="sticky top-0 z-50 bg-[#FDF6EC] pt-10 pb-6">
  <div className="relative mx-auto w-[92%] max-w-6xl rounded-3xl bg-black px-16 py-8 shadow-2xl">

    {/* LEFT LINKS */}
    <div className="flex items-center gap-10">
      {navigationItems.slice(0, Math.ceil(navigationItems.length / 2)).map((item, i) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={i === 0}
          className={({ isActive }) =>
            `font-['Inter'] text-lg tracking-wide transition-all duration-200 ${
              isActive
                ? 'text-white font-bold'
                : 'text-white/70 hover:text-white hover:font-bold'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>

    {/* CENTER LOGO */}
    <Link
      to="/"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-['Inter'] text-3xl font-semibold tracking-wide text-white hover:font-bold transition"
    >
      Music Scrobbler
    </Link>

    {/* RIGHT LINKS */}
    <div className="flex items-center justify-end gap-10">
      {navigationItems.slice(Math.ceil(navigationItems.length / 2)).map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `font-['Inter'] text-lg tracking-wide transition-all duration-200 ${
              isActive
                ? 'text-white font-bold'
                : 'text-white/70 hover:text-white hover:font-bold'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>

  </div>
</header>

      {commandOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={closeCommand}>
          <div
            className="mx-auto mt-40 w-full max-w-2xl rounded-3xl bg-[#FDF6EC] p-8 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center gap-3 rounded-full border border-[#A31621] px-5 py-3">
              <Search className="h-5 w-5 text-black/50" />
              <input
                ref={commandInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages..."
                className="w-full bg-transparent text-base font-['Inter'] outline-none"
              />
            </div>

            <div className="max-h-96 space-y-3 overflow-y-auto">
              {filteredItems.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => goToRoute(item.path)}
                  className="w-full rounded-2xl border border-[#A31621] px-6 py-4 text-left font-['Inter'] text-base transition hover:bg-[#A31621] hover:text-white hover:font-bold"
                >
                  <p>{item.label}</p>
                  <p className="text-sm opacity-70">{item.description}</p>
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