import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Icon from '../../components/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePageMeta } from '../../lib/usePageMeta.js';
import { SITE } from '../../data/siteContent.js';

export default function AdminLogin() {
  usePageMeta(
    `Admin Portal Login | ${SITE.legalName}`,
    'Authorized administrative console for dispatch coordination, consignment status updates, and transport management.'
  );

  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please provide both administrative email and password');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'admin') {
        logout();
        setError('Access denied: This portal is reserved for company administrators and fleet coordinators.');
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page auth-page--admin">
      <PageHeader
        title="Fleet Admin Console"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Admin Portal' }]}
      />

      <section className="auth-section">
        <div className="container">
          <div className="auth-card auth-card--admin">
            <div className="auth-card__header">
              <span className="auth-badge auth-badge--admin">Authorized Personnel</span>
              <h2 className="auth-card__title">Logistics & Fleet Admin</h2>
              <p className="auth-card__desc">
                Sign in to manage pending orders, record vehicle dispatch locations, update shipment dates, and track customer payments.
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
                <label htmlFor="admin-email">Admin Email *</label>
                <input
                  id="admin-email"
                  type="email"
                  name="email"
                  placeholder="admin@jmtransport.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="admin-password">Administrative Password *</label>
                <input
                  id="admin-password"
                  type="password"
                  name="password"
                  placeholder="Enter administrator password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="thm-btn thm-btn--full thm-btn--admin"
                disabled={submitting}
                style={{ marginTop: '10px' }}
              >
                {submitting ? 'Authenticating...' : 'Access Admin Console'}
              </button>
            </form>

            <div className="auth-card__footer">
              <p style={{ fontSize: '13px', color: 'var(--thm-muted)' }}>
                Customer looking for orders?{' '}
                <Link to="/customer/login" className="auth-link">
                  Customer Portal Login →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
