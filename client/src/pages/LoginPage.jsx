import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api, authService } from '../services/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(location.state?.error || '');
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '');
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to appropriate dashboard
    const user = authService.getCurrentUser();
    const role = authService.getRole();
    if (user && role === 'admin') {
      navigate('/admin-dashboard', { replace: true });
    } else if (user && role === 'student') {
      navigate('/student-dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login(email, password);

      // Save user session
      authService.setCurrentUser(res.user, res.role);

      // Redirection per spec:
      // "Logging in with the admin email routes to the Admin Dashboard; student emails route to their Student Dashboard."
      if (res.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="container py-5 my-auto">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-7 col-lg-5">
          <div className="card portal-card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <h2 className="text-center fw-bold mb-4 text-dark" style={{ fontSize: '1.75rem' }}>
                Account Login
              </h2>

              {error && (
                <div className="alert alert-danger py-2 small d-flex align-items-center justify-content-between mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-circle-fill text-danger flex-shrink-0"></i>
                    <span>{error}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-sm"
                    onClick={() => setError('')}
                  ></button>
                </div>
              )}

              {successMsg && (
                <div className="alert alert-success py-2 small d-flex align-items-center justify-content-between mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success flex-shrink-0"></i>
                    <span>{successMsg}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-sm"
                    onClick={() => setSuccessMsg('')}
                  ></button>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg fs-6"
                    placeholder="Email Address (email)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label text-secondary small fw-medium">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-lg fs-6"
                    placeholder="Password (password)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="text-start mb-4">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none text-primary small"
                    onClick={() => setShowForgotModal(true)}
                  >
                    Forget Password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 fw-medium mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  ) : null}
                  Login
                </button>

                <div className="text-center text-muted small mt-3">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary text-decoration-none fw-medium">
                    Register here
                  </Link>
                </div>
              </form>

              {/* Quick Evaluation Demo Helper Box */}
              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                    Quick Demo Credentials:
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@example.com', 'admin123')}
                    className="btn btn-outline-secondary btn-sm flex-fill"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <i className="bi bi-shield-lock me-1"></i> Admin Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('john.doe@example.com', 'password123')}
                    className="btn btn-outline-secondary btn-sm flex-fill"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <i className="bi bi-person me-1"></i> Student Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Flow Modal */}
      <ForgotPasswordModal
        show={showForgotModal}
        prefillEmail={email}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  );
}
