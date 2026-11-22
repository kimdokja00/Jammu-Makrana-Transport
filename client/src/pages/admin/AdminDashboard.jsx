import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Icon from '../../components/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { fetchAllOrders } from '../../lib/api.js';
import { usePageMeta } from '../../lib/usePageMeta.js';
import { SITE } from '../../data/siteContent.js';

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();

  usePageMeta(
    `Fleet Admin Portal | ${SITE.legalName}`,
    'Admin console for Jammu Makrana Transport: manage orders, update dispatch and payment details.'
  );

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all | pending | active | completed
  const [searchQuery, setSearchQuery] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await fetchAllOrders(token, params);
      setOrders(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders list');
    } finally {
      setLoading(false);
    }
  }, [token, activeTab, searchQuery]);

  useEffect(() => {
    if (token) {
      loadOrders();
    }
  }, [loadOrders, token]);

  // Aggregate stats across all visible orders
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => ['placed', 'confirmed', 'new'].includes(o.status)).length,
    active: orders.filter((o) => ['dispatched', 'shipped', 'in_transit'].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    totalRevenue: orders.reduce((sum, o) => sum + (Number(o.paymentAmount) || 0), 0),
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'placed':
      case 'new':
        return <span className="status-pill status-pill--placed">Placed</span>;
      case 'confirmed':
        return <span className="status-pill status-pill--confirmed">Confirmed</span>;
      case 'dispatched':
        return <span className="status-pill status-pill--dispatched">Dispatched</span>;
      case 'shipped':
      case 'in_transit':
        return <span className="status-pill status-pill--transit">Shipped / Transit</span>;
      case 'delivered':
        return <span className="status-pill status-pill--delivered">Delivered</span>;
      case 'rejected':
        return <span className="status-pill status-pill--cancelled">Rejected</span>;
      case 'cancelled':
        return <span className="status-pill status-pill--cancelled">Cancelled</span>;
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  const getPaymentBadge = (status, amount) => {
    switch (status) {
      case 'paid':
        return <span className="pay-pill pay-pill--paid">Paid (₹{(amount || 0).toLocaleString('en-IN')})</span>;
      case 'partial':
        return <span className="pay-pill pay-pill--partial">Partial (₹{(amount || 0).toLocaleString('en-IN')})</span>;
      case 'refunded':
        return <span className="pay-pill pay-pill--refunded">Refunded</span>;
      case 'pending':
      default:
        return <span className="pay-pill pay-pill--pending">Pending</span>;
    }
  };

  return (
    <div className="dashboard-page admin-dashboard">
      <PageHeader
        title="Logistics Admin Console"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Admin Portal' }]}
      />

      <section className="dashboard-section">
        <div className="container">
          {/* Admin Header */}
          <div className="dashboard-banner dashboard-banner--admin">
            <div className="dashboard-banner__info">
              <span className="dashboard-banner__kicker">Administrator Desk</span>
              <h2 className="dashboard-banner__name">{user?.fullName || 'Logistics Coordinator'}</h2>
              <div className="dashboard-banner__meta">
                <span>
                  <Icon name="badge" size={14} /> Role: Super Administrator
                </span>
                <span>
                  <Icon name="building" size={14} /> Jammu Makrana Transport Co.
                </span>
              </div>
            </div>

            <div className="dashboard-banner__actions">
              <button type="button" onClick={loadOrders} className="thm-btn thm-btn--sm" title="Refresh list">
                ↻ Refresh Orders
              </button>
              <button type="button" onClick={logout} className="thm-btn thm-btn--outline thm-btn--sm">
                Sign Out
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
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
              <div className="stat-card__icon stat-card__icon--orange">
                <Icon name="globe" size={24} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__number">{stats.active}</span>
                <span className="stat-card__label">Active Dispatches</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--green">
                <Icon name="check" size={24} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__number">{stats.delivered}</span>
                <span className="stat-card__label">Delivered</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--gold">
                <Icon name="handshake" size={24} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__number">₹{stats.totalRevenue.toLocaleString('en-IN')}</span>
                <span className="stat-card__label">Recorded Freight</span>
              </div>
            </div>
          </div>

          {/* Management Controls: Tabs & Search */}
          <div className="dashboard-content-box">
            <div className="admin-toolbar">
              <div className="admin-tabs">
                <button
                  type="button"
                  className={`admin-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All Consignments ({stats.total})
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
                  className={`admin-tab-btn ${activeTab === 'active' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('active')}
                >
                  Active Transit ({stats.active})
                </button>
                <button
                  type="button"
                  className={`admin-tab-btn ${activeTab === 'completed' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('completed')}
                >
                  Delivered ({stats.delivered})
                </button>
              </div>

              <div className="admin-search-wrap">
                <input
                  type="text"
                  placeholder="Search order #, customer, phone, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="admin-search-input"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="btn-search-clear">
                    ✕
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="alert alert--error" style={{ marginBottom: '20px' }}>
                <Icon name="close" size={16} />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="dashboard-loading">
                <div className="auth-spinner" />
                <p>Fetching orders records...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="dashboard-empty">
                <div className="dashboard-empty__icon">
                  <Icon name="truck" size={48} />
                </div>
                <h4>No Orders Matching Filter</h4>
                <p>No orders were found for the selected tab or search criteria.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="dashboard-table admin-table">
                  <thead>
                    <tr>
                      <th>Ref Number</th>
                      <th>Customer Details</th>
                      <th>Destination</th>
                      <th>Cargo Overview</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Dispatch Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const orderId = order.id || order._id;
                      const dispatchFormatted = order.dispatchDate
                        ? new Date(order.dispatchDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : '—';

                      return (
                        <tr key={orderId}>
                          <td>
                            <strong className="order-number-text">{order.orderNumber}</strong>
                            <small className="table-subtext">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : ''}
                            </small>
                          </td>
                          <td>
                            <strong>{order.fullName}</strong>
                            <div className="table-subtext">
                              <a href={`tel:${order.phone}`}>{order.phone}</a>
                              {order.companyName && ` · ${order.companyName}`}
                            </div>
                          </td>
                          <td>
                            <strong>{order.dropCity}</strong>
                            <div className="table-subtext">{order.dropState}</div>
                          </td>
                          <td>
                            <div className="table-cargo-desc">
                              {order.materialType ||
                                (order.stones && order.stones.map((s) => s.stoneName).join(', ')) ||
                                'Cargo'}
                            </div>
                            {order.weightTonnes && (
                              <small className="table-subtext">{order.weightTonnes} Tonnes</small>
                            )}
                          </td>
                          <td>{getStatusBadge(order.status)}</td>
                          <td>{getPaymentBadge(order.paymentStatus, order.paymentAmount)}</td>
                          <td>{dispatchFormatted}</td>
                          <td>
                            <Link to={`/admin/order/${orderId}`} className="thm-btn thm-btn--sm">
                              Manage ⚙
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
