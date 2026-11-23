import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Icon from '../../components/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { fetchMyOrders } from '../../lib/api.js';
import { usePageMeta } from '../../lib/usePageMeta.js';
import { SITE } from '../../data/siteContent.js';

export default function CustomerDashboard() {
  const { user, token, logout } = useAuth();

  usePageMeta(
    `Customer Dashboard | ${SITE.legalName}`,
    'View your stone transportation orders, tracking status, and delivery schedules.'
  );

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all | pending | confirmed | shipped | delivered

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        setLoading(true);
        const res = await fetchMyOrders(token);
        if (active) {
          setOrders(res.data || []);
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load your orders');
      } finally {
        if (active) setLoading(false);
      }
    }

    if (token) {
      loadOrders();
    }

    return () => {
      active = false;
    };
  }, [token]);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => ['placed', 'new'].includes(o.status)).length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    inTransit: orders.filter((o) => ['shipped', 'in_transit', 'dispatched'].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  };

  const visibleOrders = orders.filter((o) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return ['placed', 'new'].includes(o.status);
    if (activeTab === 'confirmed') return o.status === 'confirmed';
    if (activeTab === 'shipped') return ['shipped', 'in_transit', 'dispatched'].includes(o.status);
    if (activeTab === 'delivered') return o.status === 'delivered';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'placed':
      case 'new':
        return <span className="status-pill status-pill--placed">Placed</span>;
      case 'confirmed':
        return <span className="status-pill status-pill--confirmed">Confirmed</span>;
      case 'dispatched':
      case 'shipped':
      case 'in_transit':
        return <span className="status-pill status-pill--transit">Shipped / In Transit</span>;
      case 'delivered':
        return <span className="status-pill status-pill--delivered">Delivered</span>;
      case 'rejected':
        return <span className="status-pill status-pill--cancelled">Rejected (Not Placed)</span>;
      case 'cancelled':
        return <span className="status-pill status-pill--cancelled">Cancelled</span>;
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  const getPaymentBadge = (status, amount) => {
    switch (status) {
      case 'paid':
        return <span className="pay-pill pay-pill--paid">Paid {amount ? `(₹${amount.toLocaleString('en-IN')})` : ''}</span>;
      case 'partial':
        return <span className="pay-pill pay-pill--partial">Partial {amount ? `(₹${amount.toLocaleString('en-IN')})` : ''}</span>;
      case 'refunded':
        return <span className="pay-pill pay-pill--refunded">Refunded</span>;
      case 'pending':
      default:
        return <span className="pay-pill pay-pill--pending">Pending</span>;
    }
  };

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Customer Dashboard"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Customer Portal' }]}
      />

      <section className="dashboard-section">
        <div className="container">
          {/* Welcome User Banner */}
          <div className="dashboard-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
              {user?.avatar && (
                <img
                  src={user.avatar}
                  alt={user?.fullName || 'User avatar'}
                  className="dashboard-avatar"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="dashboard-banner__info">
                <span className="dashboard-banner__kicker">Welcome back,</span>
                <h2 className="dashboard-banner__name">{user?.fullName}</h2>
                <div className="dashboard-banner__meta">
                  {user?.phone ? (
                    <span>
                      <Icon name="phone" size={14} /> {user.phone}
                    </span>
                  ) : null}
                  <span>
                    <Icon name="check" size={14} /> {user?.email}
                  </span>
                  {user?.companyName && (
                    <span>
                      <Icon name="building" size={14} /> {user?.companyName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="dashboard-banner__actions">
              <Link to="/transportation#booking-form" className="thm-btn thm-btn--sm">
                ＋ Book New Transport
              </Link>
              <button type="button" onClick={logout} className="thm-btn thm-btn--outline thm-btn--sm">
                Sign Out
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="dashboard-stats-grid">
            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--blue">
                <Icon name="truck" size={24} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__number">{stats.total}</span>
                <span className="stat-card__label">Total Orders</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--amber">
                <Icon name="badge" size={24} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__number">{stats.pending}</span>
                <span className="stat-card__label">Pending Orders</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--gold">
                <Icon name="check" size={24} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__number">{stats.confirmed}</span>
                <span className="stat-card__label">Confirmed Orders</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--orange">
                <Icon name="globe" size={24} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__number">{stats.inTransit}</span>
                <span className="stat-card__label">Shipped / In Transit</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--green">
                <Icon name="handshake" size={24} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__number">{stats.delivered}</span>
                <span className="stat-card__label">Delivered Orders</span>
              </div>
            </div>
          </div>

          {/* Orders Section */}
          <div className="dashboard-content-box">
            <div className="dashboard-content-header">
              <div>
                <h3 className="dashboard-content-title">Your Order History</h3>
                <p className="dashboard-content-desc">
                  Check live dispatch, shipment progress, and payment status for all your consignments.
                </p>
              </div>
              <Link to="/transportation#booking-form" className="thm-btn thm-btn--sm">
                Place Transport Order
              </Link>
            </div>

            {orders.length > 0 && (
              <div className="admin-tabs" style={{ marginBottom: '18px' }}>
                <button
                  type="button"
                  className={`admin-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All ({stats.total})
                </button>
                <button
                  type="button"
                  className={`admin-tab-btn ${activeTab === 'pending' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('pending')}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  type="button"
                  className={`admin-tab-btn ${activeTab === 'confirmed' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('confirmed')}
                >
                  Confirmed ({stats.confirmed})
                </button>
                <button
                  type="button"
                  className={`admin-tab-btn ${activeTab === 'shipped' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('shipped')}
                >
                  Shipped ({stats.inTransit})
                </button>
                <button
                  type="button"
                  className={`admin-tab-btn ${activeTab === 'delivered' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('delivered')}
                >
                  Delivered ({stats.delivered})
                </button>
              </div>
            )}

            {error && (
              <div className="alert alert--error" style={{ marginBottom: '20px' }}>
                <Icon name="close" size={16} />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="dashboard-loading">
                <div className="auth-spinner" />
                <p>Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="dashboard-empty">
                <div className="dashboard-empty__icon">
                  <Icon name="truck" size={48} />
                </div>
                <h4>No Orders Placed Yet</h4>
                <p>
                  You haven&apos;t placed any transport bookings with your registered email yet.
                  Book your marble or mineral haulage now.
                </p>
                <Link to="/transportation#booking-form" className="thm-btn thm-btn--sm">
                  Book Your First Consignment
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Placed Date</th>
                      <th>Stones & Cargo</th>
                      <th>Destination</th>
                      <th>Order Status</th>
                      <th>Payment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOrders.map((order) => {
                      const displayDate = order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : order.arrivedByDate || '—';

                      const orderId = order.id || order._id;

                      return (
                        <tr key={orderId}>
                          <td>
                            <strong className="order-number-text">{order.orderNumber}</strong>
                          </td>
                          <td>{displayDate}</td>
                          <td>
                            <div className="table-cargo-desc">
                              {order.materialType ||
                                (order.stones && order.stones.map((s) => s.stoneName).join(', ')) ||
                                'Stone Freight'}
                            </div>
                            {order.weightTonnes && (
                              <small className="table-subtext">{order.weightTonnes} Tonnes</small>
                            )}
                          </td>
                          <td>
                            <strong>{order.dropCity}</strong>, {order.dropState}
                          </td>
                          <td>{getStatusBadge(order.status)}</td>
                          <td>{getPaymentBadge(order.paymentStatus, order.paymentAmount)}</td>
                          <td>
                            <Link
                              to={`/customer/order/${orderId}`}
                              className="btn-table-action"
                            >
                              Track & View →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
