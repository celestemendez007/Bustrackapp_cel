import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UserMenu from './UserMenu';

const Header = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-[#0C0E19] px-8 relative z-20">
      <div className="w-full px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="/logo_full.png" 
              alt="BusTrackSV" 
              className="h-12 md:h-16 w-auto"
            />
          </Link>

          {/* Navigation Links - Centered */}
          <nav className="hidden md:flex items-center gap-16 absolute left-1/2 transform -translate-x-1/2">
            {user ? (
              // Authenticated user navigation
              <>
                <Link
                  to="/dashboard"
                  className={`text-lg font-medium transition-colors duration-200 ${
                    isActive('/dashboard')
                      ? 'text-[#5D9FD9]'
                      : 'text-white hover:text-slate-300'
                  }`}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  Dashboard
                </Link>
                <Link
                  to="/map"
                  className={`text-lg font-medium transition-colors duration-200 ${
                    isActive('/map')
                      ? 'text-[#5D9FD9]'
                      : 'text-white hover:text-slate-300'
                  }`}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  Mapa
                </Link>
              </>
            ) : (
              // Public navigation
              <>
                <Link
                  to="/"
                  className={`text-lg font-medium transition-colors duration-200 ${
                    isActive('/')
                      ? 'text-[#5D9FD9]'
                      : 'text-white hover:text-slate-300'
                  }`}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  Explora
                </Link>
                <Link
                  to="/features"
                  className={`text-lg font-medium transition-colors duration-200 ${
                    isActive('/features')
                      ? 'text-[#5D9FD9]'
                      : 'text-white hover:text-slate-300'
                  }`}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  Características
                </Link>
                <Link
                  to="/about"
                  className={`text-lg font-medium transition-colors duration-200 ${
                    isActive('/about')
                      ? 'text-[#5D9FD9]'
                      : 'text-white hover:text-slate-300'
                  }`}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  Quienes somos
                </Link>
              </>
            )}
          </nav>

          {/* User Actions - Right aligned */}
          <div className="flex items-center gap-8">
            {user ? (
              // Authenticated user actions
              <UserMenu />
            ) : (
              // Public user actions
              <>
                <Link
                  to="/login"
                  className="text-lg text-white hover:text-slate-300 transition-colors duration-200"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-[#5D9FD9] text-white px-8 py-2 rounded-lg text-lg font-medium hover:bg-[#4a8fc9] transition-colors duration-200"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Empezar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
