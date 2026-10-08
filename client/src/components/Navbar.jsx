import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const role = authService.getRole();

  // Dynamic header title according to current route & mockup
  let portalTitle = 'Student Registration Portal';
  if (location.pathname === '/login' || location.pathname === '/') {
    portalTitle = 'Unified Login';
  } else if (location.pathname === '/signup') {
    portalTitle = 'Student Registration Portal';
  } else if (location.pathname === '/student-dashboard') {
    portalTitle = 'Student Dashboard';
  } else if (location.pathname === '/admin-dashboard') {
    portalTitle = 'Admin Dashboard';
  }

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="portal-navbar d-flex justify-content-between align-items-center shadow-sm">
      <div className="d-flex align-items-center">
        <Link to="/" className="portal-brand d-flex align-items-center gap-2">
          <i className="bi bi-mortarboard-fill text-primary"></i>
          <span>{portalTitle}</span>
        </Link>
      </div>

      <div className="d-flex align-items-center gap-3">
        <Link to="/" className={`portal-nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          Home
        </Link>

        {!user ? (
          <>
            <Link
              to="/signup"
              className={`portal-nav-link ${location.pathname === '/signup' ? 'active' : ''}`}
            >
              Signup
            </Link>
            <Link
              to="/login"
              className={`portal-nav-link ${location.pathname === '/login' ? 'active' : ''}`}
            >
              Login
            </Link>
          </>
        ) : (
          <>
            {role === 'student' && (
              <Link
                to="/student-dashboard"
                className={`portal-nav-link ${location.pathname === '/student-dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </Link>
            )}

            {role === 'admin' && (
              <Link
                to="/admin-dashboard"
                className={`portal-nav-link ${location.pathname === '/admin-dashboard' ? 'active' : ''}`}
              >
                Admin Panel
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 ms-2"
              title="Logout"
            >
              <i className="bi bi-box-arrow-right"></i>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
