import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Icon from '../../components/Icon.jsx';
import GoogleAuthButton from '../../components/GoogleAuthButton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePageMeta } from '../../lib/usePageMeta.js';
import { SITE } from '../../data/siteContent.js';

export default function CustomerRegister() {
  usePageMeta(
    `Customer Registration | ${SITE.legalName}`,
    'Create an account to manage your stone orders, track freight consignments, and access invoices.'
  );

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleGoogleSuccess = async (credential) => {
    setSubmitting(true);
    setError('');
    try {
      await loginWithGoogle(credential);
      navigate('/customer/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Google registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) return setError('Please enter your full name');
    if (!form.email.trim()) return setError('Please enter a valid email address');
    if (!form.phone.trim()) return setError('Please enter your phone number');
    if (!form.password || form.password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }

    setSubmitting(true);
    setError('');

    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        companyName: form.companyName.trim(),
      });
      navigate('/customer/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <PageHeader
        title="Customer Registration"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Register' }]}
      />

      <section className="auth-section">
        <div className="container">
          <div className="auth-card" style={{ maxWidth: '580px' }}>
            <div className="auth-card__header">
              <span className="auth-badge">New Customer</span>
              <h2 className="auth-card__title">Create Customer Account</h2>
              <p className="auth-card__desc">
                Register to track all your marble, stone and mineral bookings directly from Jammu Makrana Transport.
              </p>
            </div>

            {error && (
              <div className="alert alert--error" role="alert" style={{ marginBottom: '20px' }}>
                <Icon name="close" size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    placeholder="e.g. Ramesh Sharma"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="e.g. 9829575967"
                    maxLength={14}
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="e.g. ramesh@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="companyName">Company / Firm Name (Optional)</label>
                  <input
                    id="companyName"
                    type="text"
                    name="companyName"
                    placeholder="e.g. Sharma Builders"
                    value={form.companyName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="password">Password (min 6 characters) *</label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Create password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    placeholder="Repeat password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="thm-btn thm-btn--full"
                disabled={submitting}
                style={{ marginTop: '16px' }}
              >
                {submitting ? 'Creating Account...' : 'Register & Continue'}
              </button>
            </form>

            <div className="auth-divider">
              <span>or sign up with</span>
            </div>

            <GoogleAuthButton
              mode="signup"
              onSuccess={handleGoogleSuccess}
              onError={(msg) => setError(msg)}
            />

            <div className="auth-card__footer">
              <p>
                Already have an account?{' '}
                <Link to="/customer/login" className="auth-link">
                  Sign In here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
