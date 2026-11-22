import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Icon from '../../components/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { fetchOrderById, updateOrderStatus, updateOrderPayment } from '../../lib/api.js';
import { usePageMeta } from '../../lib/usePageMeta.js';
import { SITE } from '../../data/siteContent.js';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { token } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // Status form state
  const [statusForm, setStatusForm] = useState({
    status: '',
    dispatchLocation: '',
    dispatchDate: '',
    shippedDate: '',
    deliveredDate: '',
    estimatedDeliveryDate: '',
    note: '',
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    paymentStatus: '',
    paymentAmount: '',
    paymentMethod: '',
    paymentDate: '',
    paymentNotes: '',
  });

  usePageMeta(
    order ? `Manage #${order.orderNumber} | Admin` : 'Admin Order Management',
    'Edit dispatch date, shipment location, delivery milestones, and payment records.'
  );

  useEffect(() => {
    let active = true;

    async function loadOrder() {
      try {
        setLoading(true);
        const res = await fetchOrderById(id, token);
        if (active && res.data) {
          const ord = res.data;
          setOrder(ord);

          // Format ISO date strings to YYYY-MM-DD for date inputs
          const toDateInputValue = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');

          setStatusForm({
            status: ord.status || 'placed',
            dispatchLocation: ord.dispatchLocation || 'Makrana Transport Hub, Rajasthan',
            dispatchDate: toDateInputValue(ord.dispatchDate),
            shippedDate: toDateInputValue(ord.shippedDate),
            deliveredDate: toDateInputValue(ord.deliveredDate),
            estimatedDeliveryDate: toDateInputValue(ord.estimatedDeliveryDate),
            note: '',
          });

          setPaymentForm({
            paymentStatus: ord.paymentStatus || 'pending',
            paymentAmount: ord.paymentAmount !== undefined ? ord.paymentAmount : '',
            paymentMethod: ord.paymentMethod || '',
            paymentDate: toDateInputValue(ord.paymentDate),
            paymentNotes: ord.paymentNotes || '',
          });
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to retrieve order');
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id && token) {
      loadOrder();
    }

    return () => {
      active = false;
    };
  }, [id, token]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setUpdatingStatus(true);
    setStatusSuccess('');
    setError('');

    try {
      const res = await updateOrderStatus(id, statusForm, token);
      setOrder(res.data);
      setStatusSuccess('Order status and dispatch milestones updated successfully!');
      setStatusForm((prev) => ({ ...prev, note: '' }));
      setTimeout(() => setStatusSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setUpdatingPayment(true);
    setPaymentSuccess('');
    setError('');

    try {
      const res = await updateOrderPayment(id, paymentForm, token);
      setOrder(res.data);
      setPaymentSuccess('Payment details and financial records saved successfully!');
      setTimeout(() => setPaymentSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update payment information');
    } finally {
      setUpdatingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <PageHeader title="Loading Order..." crumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Order' }]} />
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          <div className="auth-spinner" />
          <p style={{ marginTop: '16px' }}>Retrieving order details...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="dashboard-page">
        <PageHeader title="Order Not Found" crumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Error' }]} />
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          <div className="alert alert--error" style={{ maxWidth: '500px', margin: '0 auto 24px' }}>
            <Icon name="close" size={16} />
            <span>{error}</span>
          </div>
          <Link to="/admin/dashboard" className="thm-btn thm-btn--sm">
            ← Return to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page admin-detail-page">
      <PageHeader
        title={`Manage Consignment #${order.orderNumber}`}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Admin Console', to: '/admin/dashboard' },
          { label: `Order #${order.orderNumber}` },
        ]}
      />

      <section className="dashboard-section">
        <div className="container">
          <div className="order-nav-row">
            <Link to="/admin/dashboard" className="btn-back">
              ← Back to Admin Console
            </Link>
            <div className="admin-status-badges">
              <span className="order-date-badge">
                Created: {new Date(order.createdAt).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {error && (
            <div className="alert alert--error" style={{ marginBottom: '20px' }}>
              <Icon name="close" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Customer & Route Snapshot Card */}
          <div className="order-details-grid" style={{ marginBottom: '30px' }}>
            <div className="detail-box">
              <h4 className="detail-box__title">
                <Icon name="target" size={18} /> Customer & Billing Info
              </h4>
              <ul className="detail-list list-unstyled">
                <li>
                  <span className="detail-label">Client Name:</span>
                  <strong>{order.fullName}</strong>
                </li>
                <li>
                  <span className="detail-label">Contact Phone:</span>
                  <a href={`tel:${order.phone}`} style={{ fontWeight: 600, color: 'var(--thm-gold)' }}>
                    {order.phone}
                  </a>
                </li>
                <li>
                  <span className="detail-label">Email:</span>
                  <a href={`mailto:${order.email}`}>{order.email}</a>
                </li>
                {order.companyName && (
                  <li>
                    <span className="detail-label">Company / Firm:</span>
                    <span>{order.companyName}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="detail-box">
              <h4 className="detail-box__title">
                <Icon name="truck" size={18} /> Destination & Delivery Target
              </h4>
              <ul className="detail-list list-unstyled">
                <li>
                  <span className="detail-label">Unloading City:</span>
                  <strong>{order.dropCity}, {order.dropState}</strong>
                </li>
                <li>
                  <span className="detail-label">Delivery Address:</span>
                  <span>{order.dropAddress}</span>
                </li>
                {order.dropPin && (
                  <li>
                    <span className="detail-label">Pincode:</span>
                    <span>{order.dropPin}</span>
                  </li>
                )}
                <li>
                  <span className="detail-label">Target Arrival Date:</span>
                  <strong>{order.arrivedByDate || order.pickupDate}</strong>
                </li>
              </ul>
            </div>

            <div className="detail-box">
              <h4 className="detail-box__title">
                <Icon name="badge" size={18} /> Consignment Summary
              </h4>
              <ul className="detail-list list-unstyled">
                <li>
                  <span className="detail-label">Current Status:</span>
                  <strong style={{ textTransform: 'capitalize', color: 'var(--thm-gold)' }}>
                    {order.status}
                  </strong>
                </li>
                <li>
                  <span className="detail-label">Payment Status:</span>
                  <strong style={{ textTransform: 'uppercase' }}>
                    {order.paymentStatus} (₹{(order.paymentAmount || 0).toLocaleString('en-IN')})
                  </strong>
                </li>
                <li>
                  <span className="detail-label">Origin:</span>
                  <span>{order.pickupCity || 'Makrana'}</span>
                </li>
                {order.specialInstructions && (
                  <li>
                    <span className="detail-label">Client Instructions:</span>
                    <small>{order.specialInstructions}</small>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* EDIT FORM 1: Order Status & Dispatch Milestone Management */}
          <div className="dashboard-content-box" style={{ marginBottom: '30px' }}>
            <div className="dashboard-content-header">
              <div>
                <h3 className="dashboard-content-title">
                  <Icon name="truck" size={20} /> Update Order Status & Dispatch Milestone
                </h3>
                <p className="dashboard-content-desc">
                  Changes made here will be visible instantly on the customer&apos;s live tracking dashboard.
                </p>
              </div>
            </div>

            {statusSuccess && (
              <div className="alert alert--success" style={{ marginBottom: '20px' }}>
                <Icon name="check" size={16} />
                <span>{statusSuccess}</span>
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="admin-manage-form">
              <div className="form-row">
                <div className="form-field" style={{ flex: 1 }}>
                  <label htmlFor="order-status-select">Order Status *</label>
                  <select
                    id="order-status-select"
                    value={statusForm.status}
                    onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}
                    required
                  >
                    <option value="placed">Placed (Order Received)</option>
                    <option value="confirmed">Confirmed (Vehicle Allocated)</option>
                    <option value="dispatched">Dispatched (Left Yard)</option>
                    <option value="shipped">Shipped / In Transit</option>
                    <option value="in_transit">In Transit (On Highway)</option>
                    <option value="delivered">Delivered (Completed)</option>
                    <option value="rejected">Rejected (Order Cancelled / Not Placed)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-field" style={{ flex: 2 }}>
                  <label htmlFor="dispatchLocation">Dispatch From Location *</label>
                  <input
                    id="dispatchLocation"
                    type="text"
                    placeholder="e.g. Makrana RIICO Area Yard #4, Rajasthan"
                    value={statusForm.dispatchLocation}
                    onChange={(e) => setStatusForm((prev) => ({ ...prev, dispatchLocation: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="dispatchDate">Dispatch Date</label>
                  <input
                    id="dispatchDate"
                    type="date"
                    value={statusForm.dispatchDate}
                    onChange={(e) => setStatusForm((prev) => ({ ...prev, dispatchDate: e.target.value }))}
                  />
                  <small style={{ color: 'var(--thm-muted)', fontSize: '11px' }}>Date truck departed Makrana</small>
                </div>

                <div className="form-field">
                  <label htmlFor="shippedDate">Shipped / Highway Date</label>
                  <input
                    id="shippedDate"
                    type="date"
                    value={statusForm.shippedDate}
                    onChange={(e) => setStatusForm((prev) => ({ ...prev, shippedDate: e.target.value }))}
                  />
                  <small style={{ color: 'var(--thm-muted)', fontSize: '11px' }}>Date consignment crossed state border</small>
                </div>

                <div className="form-field">
                  <label htmlFor="deliveredDate">Delivered Date</label>
                  <input
                    id="deliveredDate"
                    type="date"
                    value={statusForm.deliveredDate}
                    onChange={(e) => setStatusForm((prev) => ({ ...prev, deliveredDate: e.target.value }))}
                  />
                  <small style={{ color: 'var(--thm-muted)', fontSize: '11px' }}>Date unloaded at client destination</small>
                </div>

                <div className="form-field">
                  <label htmlFor="estimatedDeliveryDate">Estimated Delivery Date</label>
                  <input
                    id="estimatedDeliveryDate"
                    type="date"
                    value={statusForm.estimatedDeliveryDate}
                    onChange={(e) => setStatusForm((prev) => ({ ...prev, estimatedDeliveryDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="statusNote">Milestone Update Note / Truck Info (Logged in Timeline)</label>
                <input
                  id="statusNote"
                  type="text"
                  placeholder="e.g. Loaded onto 12-wheel truck RJ-19-GA-1234, Driver: Mukesh (+91 94140 XXXXX)"
                  value={statusForm.note}
                  onChange={(e) => setStatusForm((prev) => ({ ...prev, note: e.target.value }))}
                />
              </div>

              <button type="submit" className="thm-btn thm-btn--sm" disabled={updatingStatus}>
                {updatingStatus ? 'Updating Status...' : '💾 Save Status & Dispatch Updates'}
              </button>
            </form>
          </div>

          {/* EDIT FORM 2: Payment & Financial Management */}
          <div className="dashboard-content-box" style={{ marginBottom: '30px' }}>
            <div className="dashboard-content-header">
              <div>
                <h3 className="dashboard-content-title">
                  <Icon name="badge" size={20} /> Update Payment & Billing Status
                </h3>
                <p className="dashboard-content-desc">
                  Record advance, balance payments, payment methods, and bank reference UTRs.
                </p>
              </div>
            </div>

            {paymentSuccess && (
              <div className="alert alert--success" style={{ marginBottom: '20px' }}>
                <Icon name="check" size={16} />
                <span>{paymentSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="admin-manage-form">
              <div className="form-row">
                <div className="form-field" style={{ flex: 1 }}>
                  <label htmlFor="paymentStatus">Payment Status *</label>
                  <select
                    id="paymentStatus"
                    value={paymentForm.paymentStatus}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentStatus: e.target.value }))}
                    required
                  >
                    <option value="pending">Pending (Unpaid)</option>
                    <option value="partial">Partial Payment (Advance Received)</option>
                    <option value="paid">Paid (Full Settlement)</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div className="form-field" style={{ flex: 1 }}>
                  <label htmlFor="paymentAmount">Payment Value / Amount (₹) *</label>
                  <input
                    id="paymentAmount"
                    type="number"
                    min="0"
                    step="500"
                    placeholder="e.g. 85000"
                    value={paymentForm.paymentAmount}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentAmount: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-field" style={{ flex: 1 }}>
                  <label htmlFor="paymentMethod">Payment Method</label>
                  <input
                    id="paymentMethod"
                    type="text"
                    placeholder="e.g. NEFT / RTGS, UPI, Cheque, Cash"
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  />
                </div>

                <div className="form-field" style={{ flex: 1 }}>
                  <label htmlFor="paymentDate">Payment Date</label>
                  <input
                    id="paymentDate"
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="paymentNotes">Payment Reference & Notes</label>
                <input
                  id="paymentNotes"
                  type="text"
                  placeholder="e.g. UTR: SBIN123456789 - Advance 50% received against invoice #JMT-884"
                  value={paymentForm.paymentNotes}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentNotes: e.target.value }))}
                />
              </div>

              <button type="submit" className="thm-btn thm-btn--sm" disabled={updatingPayment}>
                {updatingPayment ? 'Saving Payment...' : '💰 Save Payment Information'}
              </button>
            </form>
          </div>

          {/* Cargo Details Table */}
          <div className="dashboard-content-box" style={{ marginBottom: '30px' }}>
            <h4 className="dashboard-content-title" style={{ marginBottom: '16px' }}>
              Consignment Cargo Manifest
            </h4>
            {order.stones && order.stones.length > 0 ? (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Stone Type</th>
                      <th>Slab Dimensions</th>
                      <th>Slab Count</th>
                      <th>Quantity (Tonnes)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.stones.map((st, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>
                          <strong>{st.stoneName}</strong>
                        </td>
                        <td>{st.slabSize || 'Standard'}</td>
                        <td>{st.slabCount || '—'}</td>
                        <td>{st.quantityTonnes ? `${st.quantityTonnes} Tonnes` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>{order.materialType || 'General Stone Consignment'}</p>
            )}
          </div>

          {/* Status Change Audit Trail */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="dashboard-content-box">
              <h4 className="dashboard-content-title" style={{ marginBottom: '16px' }}>
                Audit Trail & Status History Log
              </h4>
              <div className="history-list">
                {order.statusHistory.map((h, i) => (
                  <div key={i} className="history-item">
                    <div className="history-item__dot" />
                    <div className="history-item__body">
                      <div className="history-item__header">
                        <strong className="history-item__status">{h.status}</strong>
                        <span className="history-item__time">
                          {h.changedAt
                            ? new Date(h.changedAt).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : ''}{' '}
                          {h.changedByName && `· By ${h.changedByName}`}
                        </span>
                      </div>
                      {h.note && <p className="history-item__note">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
