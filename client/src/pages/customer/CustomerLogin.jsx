import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Icon from '../../components/Icon.jsx';
import GoogleAuthButton from '../../components/GoogleAuthButton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePageMeta } from '../../lib/usePageMeta.js';
import { SITE } from '../../data/siteContent.js';

export default function CustomerLogin() {
  usePageMeta(
    `Customer Login | ${SITE.legalName}`,
    'Access your customer dashboard to view transportation bookings, live delivery status, and order history.'
  );

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/customer/dashboard';

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleGoogleSuccess = async (credential) => {
    setSubmitting(true);
    setError('');
    try {
      const user = await loginWithGoogle(credential);
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in both email and password');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <PageHeader
        title="Customer Login"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Customer Login' }]}
      />

      <section className="auth-section">
        <div className="container">
          <div className="auth-card">
            <div className="auth-card__header">
              <span className="auth-badge">Customer Portal</span>
              <h2 className="auth-card__title">Sign In to Your Account</h2>
              <p className="auth-card__desc">
                Track your active stone shipments, review consignment history, and manage delivery addresses.
              </p>
            </div>

            {error && (
              <div className="alert alert--error" role="alert" style={{ marginBottom: '20px' }}>
                <Icon name="close" size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-field">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="thm-btn thm-btn--full"
                disabled={submitting}
                style={{ marginTop: '10px' }}
              >
                {submitting ? 'Signing in...' : 'Sign In to Portal'}
              </button>
            </form>

            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            <GoogleAuthButton
              mode="signin"
              onSuccess={handleGoogleSuccess}
              onError={(msg) => setError(msg)}
            />

            <div className="auth-card__footer">
              <p>
                Don&apos;t have an account yet?{' '}
                <Link to="/customer/register" className="auth-link">
                  Register as Customer
                </Link>
              </p>
              <div className="auth-divider">
                <span>or</span>
              </div>
              <p style={{ marginTop: '12px', fontSize: '13px' }}>
                Company fleet manager?{' '}
                <Link to="/admin/login" className="auth-link" style={{ fontWeight: 600 }}>
                  Admin Portal Login →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
