import { Link, NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const navLinkClasses = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
  }`;

export const Navbar = ({ username, onLogout }) => {
  return (
    <header className="border-b border-gray-800 bg-gray-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-lg font-semibold text-white">
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
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <span className="hidden text-sm text-gray-300 sm:block">
            Signed in as <span className="font-semibold text-white">{username}</span>
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center space-x-2 rounded-md border border-purple-500 px-3 py-2 text-sm font-medium text-purple-200 transition hover:bg-purple-500 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      <nav className="flex items-center justify-center space-x-2 border-t border-gray-800 bg-gray-900 px-4 py-3 md:hidden">
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
      </nav>
    </header>
  );
};
