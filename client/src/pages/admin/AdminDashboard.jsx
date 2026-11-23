import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Icon from '../../components/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { fetchAllOrders, fetchEnquiries, updateEnquiryStatus } from '../../lib/api.js';
import { usePageMeta } from '../../lib/usePageMeta.js';
import { SITE } from '../../data/siteContent.js';

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();

  usePageMeta(
    `Fleet Admin Portal | ${SITE.legalName}`,
    'Admin console for Jammu Makrana Transport: manage orders, update dispatch and payment details.'
  );

  const [mainSection, setMainSection] = useState('orders'); // 'orders' | 'enquiries'

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all | pending | active | completed
  const [searchQuery, setSearchQuery] = useState('');

  // Enquiries State
  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [enquiryFilter, setEnquiryFilter] = useState('all'); // all | new | contacted | closed

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

  const loadEnquiries = useCallback(async () => {
    try {
      setLoadingEnquiries(true);
      const res = await fetchEnquiries(token);
      setEnquiries(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch enquiries:', err.message);
    } finally {
      setLoadingEnquiries(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadOrders();
      loadEnquiries();
    }
  }, [loadOrders, loadEnquiries, token]);

  const handleEnquiryStatusChange = async (enquiryId, newStatus) => {
    try {
      await updateEnquiryStatus(enquiryId, newStatus, token);
      setEnquiries((prev) =>
        prev.map((e) => ((e.id === enquiryId || e._id === enquiryId) ? { ...e, status: newStatus } : e))
      );
    } catch (err) {
      alert(err.message || 'Failed to update enquiry status');
    }
  };

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
      case 'shipped':
      case 'in_transit':
        return <span className="status-pill status-pill--transit">Shipped / In Transit</span>;
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
            {/* Main Section Switcher */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`thm-btn thm-btn--sm ${mainSection === 'orders' ? '' : 'thm-btn--outline'}`}
                onClick={() => setMainSection('orders')}
              >
                <Icon name="truck" size={14} style={{ marginRight: '6px' }} /> Consignments &amp; Orders ({orders.length})
              </button>
              <button
                type="button"
                className={`thm-btn thm-btn--sm ${mainSection === 'enquiries' ? '' : 'thm-btn--outline'}`}
                onClick={() => setMainSection('enquiries')}
              >
                <Icon name="envelope" size={14} style={{ marginRight: '6px' }} /> Customer Inquiries / Messages ({enquiries.length})
                {enquiries.filter((e) => e.status === 'new').length > 0 && (
                  <span
                    style={{
                      marginLeft: '6px',
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '1px 6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  >
                    {enquiries.filter((e) => e.status === 'new').length} New
                  </span>
                )}
              </button>
            </div>

            {mainSection === 'orders' ? (
              <>
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
                      Shipped ({stats.active})
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
                          <th>Shipped Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => {
                          const orderId = order.id || order._id;
                          const shippedFormatted = (order.shippedDate || order.dispatchDate)
                            ? new Date(order.shippedDate || order.dispatchDate).toLocaleDateString('en-IN', {
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
                              <td>{shippedFormatted}</td>
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
              </>
            ) : (
              /* Enquiries & Messages Section */
              <div className="admin-enquiries-view">
                <div className="admin-toolbar">
                  <div className="admin-tabs">
                    <button
                      type="button"
                      className={`admin-tab-btn ${enquiryFilter === 'all' ? 'is-active' : ''}`}
                      onClick={() => setEnquiryFilter('all')}
                    >
                      All Inquiries ({enquiries.length})
                    </button>
                    <button
                      type="button"
                      className={`admin-tab-btn ${enquiryFilter === 'new' ? 'is-active' : ''}`}
                      onClick={() => setEnquiryFilter('new')}
                    >
                      New ({enquiries.filter((e) => e.status === 'new').length})
                    </button>
                    <button
                      type="button"
                      className={`admin-tab-btn ${enquiryFilter === 'contacted' ? 'is-active' : ''}`}
                      onClick={() => setEnquiryFilter('contacted')}
                    >
                      Contacted ({enquiries.filter((e) => e.status === 'contacted').length})
                    </button>
                    <button
                      type="button"
                      className={`admin-tab-btn ${enquiryFilter === 'closed' ? 'is-active' : ''}`}
                      onClick={() => setEnquiryFilter('closed')}
                    >
                      Closed ({enquiries.filter((e) => e.status === 'closed').length})
                    </button>
                  </div>
                </div>

                {loadingEnquiries ? (
                  <div className="dashboard-loading">
                    <div className="auth-spinner" />
                    <p>Fetching messages...</p>
                  </div>
                ) : enquiries.length === 0 ? (
                  <div className="dashboard-empty">
                    <div className="dashboard-empty__icon">
                      <Icon name="envelope" size={48} />
                    </div>
                    <h4>No Inquiries Received Yet</h4>
                    <p>Customer messages from the &ldquo;Leave a message&rdquo; contact form will appear here.</p>
                  </div>
                ) : (
                  <div>
                    {enquiries
                      .filter((e) => (enquiryFilter === 'all' ? true : e.status === enquiryFilter))
                      .map((enq) => {
                        const enqId = enq.id || enq._id;
                        const dateFormatted = enq.createdAt
                          ? new Date(enq.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '';

                        const cleanPhone = String(enq.phone || '').replace(/\D/g, '');
                        const waTarget = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

                        return (
                          <div key={enqId} className="enquiry-card">
                            <div className="enquiry-card__header">
                              <div>
                                <h4 className="enquiry-card__title">{enq.subject || 'Stone & Freight Inquiry'}</h4>
                                <div className="enquiry-card__meta">
                                  <span>
                                    <strong>From:</strong> {enq.name}
                                  </span>
                                  <span>
                                    <Icon name="phone" size={13} style={{ marginRight: '4px' }} />
                                    <a href={`tel:${enq.phone}`}>{enq.phone}</a>
                                  </span>
                                  <span>
                                    <Icon name="envelope" size={13} style={{ marginRight: '4px' }} />
                                    <a href={`mailto:${enq.email}`}>{enq.email}</a>
                                  </span>
                                  {enq.stoneOfInterest && (
                                    <span>
                                      <strong>Interested in:</strong> {enq.stoneOfInterest}
                                    </span>
                                  )}
                                  <span>
                                    <Icon name="calendar" size={13} style={{ marginRight: '4px' }} />
                                    {dateFormatted}
                                  </span>
                                </div>
                              </div>
                              <span className={`enquiry-pill enquiry-pill--${enq.status || 'new'}`}>
                                {enq.status || 'new'}
                              </span>
                            </div>

                            <div className="enquiry-card__body">{enq.message}</div>

                            <div className="enquiry-card__actions">
                              <div className="enquiry-btn-group">
                                {cleanPhone && (
                                  <a
                                    href={`https://wa.me/${waTarget}?text=${encodeURIComponent(
                                      `Hello ${enq.name}, thank you for contacting Jammu Makrana Transport regarding: "${enq.subject}".`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="thm-btn thm-btn--sm"
                                    style={{ background: '#25D366', borderColor: '#25D366' }}
                                  >
                                    <Icon name="whatsapp" size={14} style={{ marginRight: '4px' }} /> Reply via WhatsApp
                                  </a>
                                )}
                                <a href={`tel:${enq.phone}`} className="thm-btn thm-btn--outline thm-btn--sm">
                                  <Icon name="phone" size={14} style={{ marginRight: '4px' }} /> Call
                                </a>
                                <a href={`mailto:${enq.email}`} className="thm-btn thm-btn--outline thm-btn--sm">
                                  <Icon name="envelope" size={14} style={{ marginRight: '4px' }} /> Email
                                </a>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <small style={{ color: '#64748b', fontSize: '12px' }}>Mark status:</small>
                                <select
                                  value={enq.status || 'new'}
                                  onChange={(e) => handleEnquiryStatusChange(enqId, e.target.value)}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '13px',
                                  }}
                                >
                                  <option value="new">New</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="closed">Closed</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
