import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Icon from '../../components/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { fetchOrderById } from '../../lib/api.js';
import { usePageMeta } from '../../lib/usePageMeta.js';
import { SITE } from '../../data/siteContent.js';

const STATUS_STEPS = [
  { key: 'placed', label: 'Placed', icon: 'check' },
  { key: 'confirmed', label: 'Confirmed', icon: 'badge' },
  { key: 'dispatched', label: 'Dispatched', icon: 'factory' },
  { key: 'shipped', label: 'Shipped / In Transit', icon: 'truck' },
  { key: 'delivered', label: 'Delivered', icon: 'handshake' },
];

function getStatusStepIndex(status) {
  switch (status) {
    case 'placed':
    case 'new':
      return 0;
    case 'confirmed':
      return 1;
    case 'dispatched':
      return 2;
    case 'shipped':
    case 'in_transit':
      return 3;
    case 'delivered':
      return 4;
    case 'rejected':
      return -2;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
}

export default function CustomerOrderDetail() {
  const { id } = useParams();
  const { token } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  usePageMeta(
    order ? `Order #${order.orderNumber} | ${SITE.legalName}` : 'Order Tracking',
    'Track consignment progress, delivery milestones, and dispatch information.'
  );

  useEffect(() => {
    let active = true;

    async function loadOrder() {
      try {
        setLoading(true);
        const res = await fetchOrderById(id, token);
        if (active) setOrder(res.data);
      } catch (err) {
        if (active) setError(err.message || 'Could not load order details');
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

  if (loading) {
    return (
      <div className="dashboard-page">
        <PageHeader title="Order Tracking" crumbs={[{ label: 'Dashboard', to: '/customer/dashboard' }, { label: 'Tracking' }]} />
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          <div className="auth-spinner" />
          <p style={{ marginTop: '16px' }}>Loading order milestones...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="dashboard-page">
        <PageHeader title="Order Not Found" crumbs={[{ label: 'Dashboard', to: '/customer/dashboard' }, { label: 'Error' }]} />
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          <div className="alert alert--error" style={{ maxWidth: '500px', margin: '0 auto 24px' }}>
            <Icon name="close" size={16} />
            <span>{error || 'Order could not be found'}</span>
          </div>
          <Link to="/customer/dashboard" className="thm-btn thm-btn--sm">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getStatusStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const isRejected = order.status === 'rejected';

  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : order.arrivedByDate;

  return (
    <div className="dashboard-page">
      <PageHeader
        title={`Booking #${order.orderNumber}`}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Customer Portal', to: '/customer/dashboard' },
          { label: order.orderNumber },
        ]}
      />

      <section className="dashboard-section">
        <div className="container">
          <div className="order-nav-row">
            <Link to="/customer/dashboard" className="btn-back">
              ← Back to My Orders
            </Link>
            <span className="order-date-badge">Placed on: {orderDate}</span>
          </div>

          {/* Visual Status Progress Tracker */}
          <div className="tracking-card">
            <div className="tracking-card__header">
              <div>
                <span className="section-title__tagline">Live Consignment Tracking</span>
                <h3 className="tracking-card__title">Order Status: <span style={{ textTransform: 'capitalize' }}>{order.status}</span></h3>
              </div>
              <div className="tracking-card__ref">
                <span>Ref Number:</span>
                <strong>{order.orderNumber}</strong>
              </div>
            </div>

            {isRejected ? (
              <div className="alert alert--error" style={{ margin: '20px 0', padding: '16px 20px', borderRadius: '8px' }}>
                <Icon name="close" size={24} />
                <div>
                  <strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
                    Order Status: REJECTED (Consignment Cancelled)
                  </strong>
                  <span>This booking was marked as <strong>Rejected</strong> by the admin. The order has not been placed and no vehicle will be dispatched.</span>
                </div>
              </div>
            ) : isCancelled ? (
              <div className="alert alert--error" style={{ margin: '20px 0' }}>
                <Icon name="close" size={18} />
                <span>This booking has been cancelled. Please contact our support team for any queries.</span>
              </div>
            ) : (
              <div className="progress-timeline">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;

                  return (
                    <div
                      key={step.key}
                      className={`timeline-step ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
                    >
                      <div className="timeline-step__marker">
                        <Icon name={step.icon} size={16} />
                      </div>
                      <div className="timeline-step__label">{step.label}</div>
                      {step.key === 'dispatched' && order.dispatchDate && (
                        <div className="timeline-step__date">
                          {new Date(order.dispatchDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                      {step.key === 'shipped' && order.shippedDate && (
                        <div className="timeline-step__date">
                          {new Date(order.shippedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                      {step.key === 'delivered' && order.deliveredDate && (
                        <div className="timeline-step__date">
                          {new Date(order.deliveredDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grid of Details: Destination + Dispatch & Payment */}
          <div className="order-details-grid">
            {/* Box 1: Delivery Destination */}
            <div className="detail-box">
              <h4 className="detail-box__title">
                <Icon name="target" size={18} /> Unloading Destination
              </h4>
              <ul className="detail-list list-unstyled">
                <li>
                  <span className="detail-label">City & State:</span>
                  <strong>{order.dropCity}, {order.dropState}</strong>
                </li>
                <li>
                  <span className="detail-label">Site Delivery Address:</span>
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
                {order.specialInstructions && (
                  <li>
                    <span className="detail-label">Site Notes:</span>
                    <span style={{ fontStyle: 'italic' }}>{order.specialInstructions}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Box 2: Dispatch & Vehicle Info */}
            <div className="detail-box">
              <h4 className="detail-box__title">
                <Icon name="truck" size={18} /> Dispatch & Fleet Tracking
              </h4>
              <ul className="detail-list list-unstyled">
                <li>
                  <span className="detail-label">Origin Hub:</span>
                  <strong>{order.pickupCity || 'Makrana, Rajasthan'}</strong>
                </li>
                <li>
                  <span className="detail-label">Dispatch Location:</span>
                  <strong>{order.dispatchLocation || 'Makrana Transport Yard / Mines'}</strong>
                </li>
                <li>
                  <span className="detail-label">Dispatch Date:</span>
                  <span>
                    {order.dispatchDate
                      ? new Date(order.dispatchDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Pending Dispatch'}
                  </span>
                </li>
                {order.shippedDate && (
                  <li>
                    <span className="detail-label">Shipped On:</span>
                    <span>{new Date(order.shippedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </li>
                )}
                {order.deliveredDate && (
                  <li>
                    <span className="detail-label">Delivered On:</span>
                    <strong style={{ color: 'var(--thm-primary)' }}>
                      {new Date(order.deliveredDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </strong>
                  </li>
                )}
                {order.vehicleType && (
                  <li>
                    <span className="detail-label">Assigned Vehicle:</span>
                    <span>{order.vehicleType}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Box 3: Payment Status */}
            <div className="detail-box">
              <h4 className="detail-box__title">
                <Icon name="badge" size={18} /> Payment & Billing
              </h4>
              <ul className="detail-list list-unstyled">
                <li>
                  <span className="detail-label">Payment Status:</span>
                  <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                    {order.paymentStatus || 'Pending'}
                  </span>
                </li>
                <li>
                  <span className="detail-label">Billing Amount:</span>
                  <strong style={{ fontSize: '18px', color: 'var(--thm-gold)' }}>
                    ₹{(order.paymentAmount || 0).toLocaleString('en-IN')}
                  </strong>
                </li>
                {order.paymentMethod && (
                  <li>
                    <span className="detail-label">Payment Mode:</span>
                    <span>{order.paymentMethod}</span>
                  </li>
                )}
                {order.paymentDate && (
                  <li>
                    <span className="detail-label">Payment Date:</span>
                    <span>
                      {new Date(order.paymentDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </li>
                )}
                {order.paymentNotes && (
                  <li>
                    <span className="detail-label">Remarks:</span>
                    <small>{order.paymentNotes}</small>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Cargo Stones Details Table */}
          <div className="dashboard-content-box" style={{ marginTop: '30px' }}>
            <h4 className="dashboard-content-title" style={{ marginBottom: '16px' }}>
              Ordered Stone Cargo Items
            </h4>

            {order.stones && order.stones.length > 0 ? (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Stone Type</th>
                      <th>Slab Dimensions / Size</th>
                      <th>Slab Count</th>
                      <th>Total Tonnes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.stones.map((st, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>
                          <strong>{st.stoneName}</strong>
                        </td>
                        <td>{st.slabSize || 'Standard Specification'}</td>
                        <td>{st.slabCount || '—'}</td>
                        <td>{st.quantityTonnes ? `${st.quantityTonnes} Tonnes` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>{order.materialType || 'Stone Consignment'}</p>
            )}
          </div>

          {/* Tracking History Log */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="dashboard-content-box" style={{ marginTop: '30px' }}>
              <h4 className="dashboard-content-title" style={{ marginBottom: '16px' }}>
                Consignment Timeline & Updates
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
                            : ''}
                        </span>
                      </div>
                      {h.note && <p className="history-item__note">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancellation & Admin Contact Actions */}
          <div className="order-support-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: '30px' }}>
            <div>
              <h4>Order Cancellation & Admin Support</h4>
              <p>
                Need to cancel this booking? Contact admin via WhatsApp or Call. The admin will verify your request and change the order status to <strong>Rejected</strong> so that the order is not placed or dispatched.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/919919400782?text=${encodeURIComponent(
                  `Hi Admin, I have a query/cancellation request regarding order: ${order.orderNumber}\nCustomer: ${order.fullName}\nPhone: ${order.phone}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="thm-btn thm-btn--whatsapp"
              >
                <Icon name="whatsapp" size={18} /> WhatsApp Admin (9919400782)
              </a>
              <a href="tel:+919919400782" className="thm-btn thm-btn--outline">
                <Icon name="phone" size={18} /> Call Admin (+91 99194 00782)
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
