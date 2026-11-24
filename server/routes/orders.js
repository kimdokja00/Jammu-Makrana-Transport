import { Router } from 'express';
import { connectDb, isDbConfigured } from '../lib/db.js';
import Order from '../models/Order.js';
import { authMiddleware, optionalAuth, adminOnly } from '../lib/auth.js';
import { sendOrderStatusEmail } from '../lib/email.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory fallback so orders still work before Atlas is wired up.
const memory = globalThis.__jmtOrders || (globalThis.__jmtOrders = []);

function generateOrderNumber() {
  const prefix = 'JMT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * POST /api/orders
 * Body: {
 *   fullName, phone, email, companyName?,
 *   dropCity, dropState, dropAddress, dropPin?,
 *   stones: [{ stoneName, slabSize?, slabCount?, quantityTonnes? }],
 *   arrivedByDate, specialInstructions?,
 *   pickupCity?, pickupAddress?, pickupPin?, vehicleType?
 * }
 */
router.post('/', optionalAuth, async (req, res) => {
  const {
    fullName,
    phone,
    email,
    companyName,
    dropCity,
    dropState,
    dropAddress,
    dropPin,
    stones,
    arrivedByDate,
    pickupDate,
    specialInstructions,
    // Optional / legacy fields
    pickupCity,
    pickupAddress,
    pickupPin,
    vehicleType,
    materialType,
    quantity,
    weightTonnes,
  } = req.body ?? {};

  const errors = {};
  if (!fullName?.trim()) errors.fullName = 'Full name is required';
  if (!phone?.trim()) errors.phone = 'Phone number is required';
  if (!email?.trim() || !EMAIL_RE.test(email.trim())) errors.email = 'A valid email is required';

  if (!dropCity?.trim()) errors.dropCity = 'Destination city is required';
  if (!dropState?.trim()) errors.dropState = 'Destination state is required';
  if (!dropAddress?.trim()) errors.dropAddress = 'Destination address is required';

  const effectiveArrivalDate = (arrivedByDate || pickupDate || '').trim();
  if (!effectiveArrivalDate) {
    errors.arrivedByDate = 'Arrived by date is required';
  }

  // Parse and validate stones array
  let parsedStones = [];
  if (Array.isArray(stones) && stones.length > 0) {
    parsedStones = stones
      .map((item) => ({
        stoneName: String(item.stoneName || '').trim(),
        slabSize: String(item.slabSize || '').trim(),
        slabCount: String(item.slabCount || '').trim(),
        quantityTonnes: String(item.quantityTonnes || '').trim(),
      }))
      .filter((item) => item.stoneName);

    if (!parsedStones.length) {
      errors.stones = 'Please select at least one stone and specify slab size, slab count, or tonnes';
    }
  } else if (materialType?.trim()) {
    // Backwards compatibility with legacy single material payload
    parsedStones = [
      {
        stoneName: materialType.trim(),
        slabSize: '',
        slabCount: quantity?.trim() || '',
        quantityTonnes: weightTonnes?.trim() || '',
      },
    ];
  } else {
    errors.stones = 'Please add at least one stone to your cargo details';
  }

  if (Object.keys(errors).length) {
    return res.status(400).json({ error: 'Validation failed', errors });
  }

  const orderNumber = generateOrderNumber();

  // Generate convenient summary strings for quick view
  const summaryMaterial = parsedStones.map((s) => s.stoneName).join(', ');
  const summaryQuantity = parsedStones
    .map((s) => {
      const parts = [];
      if (s.slabSize) parts.push(`Size: ${s.slabSize}`);
      if (s.slabCount) parts.push(`${s.slabCount} Slabs`);
      if (s.quantityTonnes) parts.push(`${s.quantityTonnes} Tonnes`);
      return `${s.stoneName}${parts.length ? ` (${parts.join(', ')})` : ''}`;
    })
    .join('; ');

  const summaryWeight = parsedStones
    .map((s) => s.quantityTonnes)
    .filter(Boolean)
    .join(' + ');

  const customerId = req.user?.id || null;
  const initialHistory = [
    {
      status: 'placed',
      changedAt: new Date(),
      changedByName: req.user ? req.user.fullName : 'Customer',
      note: 'Order successfully placed via website',
    },
  ];

  const payload = {
    orderNumber,
    customerId,
    fullName: fullName.trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    companyName: companyName?.trim() || '',

    dropCity: dropCity.trim(),
    dropState: dropState.trim(),
    dropAddress: dropAddress.trim(),
    dropPin: dropPin?.trim() || '',

    pickupCity: pickupCity?.trim() || 'Makrana',
    pickupAddress: pickupAddress?.trim() || '',
    pickupPin: pickupPin?.trim() || '',

    stones: parsedStones,
    materialType: summaryMaterial,
    quantity: summaryQuantity,
    weightTonnes: summaryWeight || weightTonnes?.trim() || '',

    arrivedByDate: effectiveArrivalDate,
    pickupDate: effectiveArrivalDate,

    vehicleType: vehicleType?.trim() || '',
    specialInstructions: specialInstructions?.trim() || '',
    status: 'placed',

    paymentStatus: 'pending',
    paymentAmount: 0,
    statusHistory: initialHistory,
  };

  try {
    if (isDbConfigured()) {
      await connectDb();
      const created = await Order.create(payload);

      // Async email confirmation for newly placed booking
      sendOrderStatusEmail(created, 'placed').catch((err) =>
        console.warn('[orders/create] Email notification error:', err?.message || err)
      );

      return res.status(201).json({ source: 'mongodb', data: created });
    }
  } catch (err) {
    console.error('[orders] MongoDB write failed, using local store fallback:', err.message);
  }

  const record = {
    ...payload,
    id: `local-order-${memory.length + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memory.push(record);

  // Async email confirmation for newly placed booking (fallback mode)
  sendOrderStatusEmail(record, 'placed').catch((err) =>
    console.warn('[orders/create] Email notification error:', err?.message || err)
  );

  return res.status(201).json({ source: 'memory', data: record });
});

/**
 * GET /api/orders/my-orders
 * Customer endpoint: returns all orders placed by the authenticated customer
 */
router.get('/my-orders', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const userEmail = (req.user.email || '').toLowerCase().trim();

  try {
    if (isDbConfigured()) {
      try {
        await connectDb();
        // Match by customerId OR email (in case guest order was placed with same email)
        const query = {
          $or: [{ customerId: userId }, { email: userEmail }],
        };
        const orders = await Order.find(query).sort({ createdAt: -1 }).lean({ virtuals: true });
        return res.json({ count: orders.length, data: orders });
      } catch (dbErr) {
        console.warn('[orders/my-orders] DB query failed, using memory fallback:', dbErr.message);
      }
    }

    // Memory fallback
    const matched = memory.filter(
      (o) => o.customerId === userId || (o.email && o.email.toLowerCase() === userEmail)
    );
    return res.json({ count: matched.length, data: [...matched].reverse() });
  } catch (err) {
    console.error('[orders/my-orders] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve your order history' });
  }
});

/**
 * GET /api/orders/:id
 * Customer or Admin endpoint: get single order details
 */
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';
  const userId = req.user.id;
  const userEmail = (req.user.email || '').toLowerCase().trim();

  try {
    let order = null;
    if (isDbConfigured()) {
      try {
        await connectDb();
        order = await Order.findById(id).lean({ virtuals: true });
        if (!order) {
          order = await Order.findOne({ orderNumber: id }).lean({ virtuals: true });
        }
      } catch (dbErr) {
        console.warn('[orders/:id] DB query failed, using memory fallback:', dbErr.message);
        order = memory.find((o) => o.id === id || o.orderNumber === id || o._id === id);
      }
    } else {
      order = memory.find((o) => o.id === id || o.orderNumber === id || o._id === id);
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Access check: customers can only view their own orders
    if (!isAdmin) {
      const isOwner =
        (order.customerId && String(order.customerId) === String(userId)) ||
        (order.email && order.email.toLowerCase() === userEmail);

      if (!isOwner) {
        return res.status(403).json({ error: 'You are not authorized to view this order' });
      }
    }

    return res.json({ data: order });
  } catch (err) {
    console.error('[orders/:id] Error:', err);
    return res.status(500).json({ error: 'Failed to load order details' });
  }
});

/**
 * GET /api/orders
 * Admin list with filters & search.
 * Accepts either:
 *  1) Valid JWT with role 'admin'
 *  2) Header 'x-admin-token' matching ADMIN_TOKEN
 */
router.get('/', optionalAuth, async (req, res) => {
  const adminToken = process.env.ADMIN_TOKEN;
  const headerToken = req.get('x-admin-token');
  const isAdmin = req.user?.role === 'admin' || (adminToken && headerToken === adminToken);

  if (!isAdmin) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  const { status, search, fromDate, toDate } = req.query;

  try {
    if (isDbConfigured()) {
      try {
        await connectDb();
        const filter = {};

        if (status && status !== 'all') {
          if (status === 'pending') {
            filter.status = { $in: ['placed', 'confirmed', 'new'] };
          } else if (status === 'active') {
            filter.status = { $in: ['dispatched', 'shipped', 'in_transit'] };
          } else if (status === 'done' || status === 'completed') {
            filter.status = 'delivered';
          } else {
            filter.status = status;
          }
        }

        if (search && search.trim()) {
          const regex = new RegExp(search.trim(), 'i');
          filter.$or = [
            { orderNumber: regex },
            { fullName: regex },
            { phone: regex },
            { email: regex },
            { dropCity: regex },
          ];
        }

        if (fromDate || toDate) {
          filter.createdAt = {};
          if (fromDate) filter.createdAt.$gte = new Date(fromDate);
          if (toDate) filter.createdAt.$lte = new Date(new Date(toDate).setHours(23, 59, 59, 999));
        }

        const data = await Order.find(filter).sort({ createdAt: -1 }).limit(300).lean({ virtuals: true });
        return res.json({ count: data.length, data });
      } catch (dbErr) {
        console.warn('[orders/all] DB query failed, using memory fallback:', dbErr.message);
      }
    }

    // Memory filtering
    let filtered = [...memory];
    if (status && status !== 'all') {
      if (status === 'pending') {
        filtered = filtered.filter((o) => ['placed', 'confirmed', 'new'].includes(o.status));
      } else if (status === 'active') {
        filtered = filtered.filter((o) => ['dispatched', 'shipped', 'in_transit'].includes(o.status));
      } else if (status === 'done' || status === 'completed') {
        filtered = filtered.filter((o) => o.status === 'delivered');
      } else {
        filtered = filtered.filter((o) => o.status === status);
      }
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.fullName?.toLowerCase().includes(q) ||
          o.phone?.includes(q) ||
          o.dropCity?.toLowerCase().includes(q)
      );
    }

    return res.json({ count: filtered.length, data: filtered.reverse() });
  } catch (err) {
    console.error('[orders/get-all] Error:', err);
    return res.status(500).json({ error: 'Failed to load orders list' });
  }
});

/**
 * PATCH /api/orders/:id/status
 * Admin only: update order status, dispatch/shipped/delivered dates, location, notes
 */
router.patch('/:id/status', authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params;
  const {
    status,
    dispatchDate,
    dispatchLocation,
    shippedDate,
    deliveredDate,
    estimatedDeliveryDate,
    note,
  } = req.body ?? {};

  const validStatuses = ['placed', 'confirmed', 'dispatched', 'shipped', 'in_transit', 'delivered', 'rejected', 'cancelled'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const historyEntry = {
    status: status || 'status_updated',
    changedAt: new Date(),
    changedBy: req.user.id,
    changedByName: req.user.fullName || 'Admin',
    note: note || `Status updated to ${status || 'current'}`,
  };

  try {
    if (isDbConfigured()) {
      try {
        await connectDb();
        const order = await Order.findById(id);
        if (order) {
          if (status) order.status = status;
          if (dispatchDate !== undefined) order.dispatchDate = dispatchDate ? new Date(dispatchDate) : null;
          if (dispatchLocation !== undefined) order.dispatchLocation = dispatchLocation;
          if (shippedDate !== undefined) order.shippedDate = shippedDate ? new Date(shippedDate) : null;
          if (deliveredDate !== undefined) order.deliveredDate = deliveredDate ? new Date(deliveredDate) : null;
          if (estimatedDeliveryDate !== undefined)
            order.estimatedDeliveryDate = estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null;

          order.statusHistory.push(historyEntry);
          await order.save();

          // Dispatch status update email to customer asynchronously
          if (status) {
            sendOrderStatusEmail(order, status, note).catch((emailErr) =>
              console.warn('[orders/:id/status] Email notification error:', emailErr?.message || emailErr)
            );
          }

          return res.json({ message: 'Order status updated successfully', data: order });
        }
      } catch (dbErr) {
        console.warn('[orders/:id/status] DB update failed, using memory fallback:', dbErr.message);
      }
    }

    // Memory fallback
    const orderIndex = memory.findIndex((o) => o.id === id || o.orderNumber === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = memory[orderIndex];
    if (status) order.status = status;
    if (dispatchDate !== undefined) order.dispatchDate = dispatchDate;
    if (dispatchLocation !== undefined) order.dispatchLocation = dispatchLocation;
    if (shippedDate !== undefined) order.shippedDate = shippedDate;
    if (deliveredDate !== undefined) order.deliveredDate = deliveredDate;
    if (estimatedDeliveryDate !== undefined) order.estimatedDeliveryDate = estimatedDeliveryDate;

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push(historyEntry);
    order.updatedAt = new Date().toISOString();

    // Dispatch status update email to customer asynchronously (memory fallback)
    if (status) {
      sendOrderStatusEmail(order, status, note).catch((emailErr) =>
        console.warn('[orders/:id/status] Email notification error:', emailErr?.message || emailErr)
      );
    }

    return res.json({ message: 'Order status updated successfully', data: order });
  } catch (err) {
    console.error('[orders/:id/status] Error:', err);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
});

/**
 * PATCH /api/orders/:id/payment
 * Admin only: update payment status, payment amount, payment method, date, notes
 */
router.patch('/:id/payment', authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { paymentStatus, paymentAmount, paymentMethod, paymentDate, paymentNotes } = req.body ?? {};

  const validPaymentStatuses = ['pending', 'partial', 'paid', 'refunded'];
  if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
    return res.status(400).json({ error: `Invalid payment status. Allowed: ${validPaymentStatuses.join(', ')}` });
  }

  try {
    if (isDbConfigured()) {
      try {
        await connectDb();
        const order = await Order.findById(id);
        if (order) {
          if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
          if (paymentAmount !== undefined) order.paymentAmount = Number(paymentAmount) || 0;
          if (paymentMethod !== undefined) order.paymentMethod = paymentMethod.trim();
          if (paymentDate !== undefined) order.paymentDate = paymentDate ? new Date(paymentDate) : null;
          if (paymentNotes !== undefined) order.paymentNotes = paymentNotes.trim();

          order.statusHistory.push({
            status: `Payment: ${order.paymentStatus} (₹${order.paymentAmount})`,
            changedAt: new Date(),
            changedBy: req.user.id,
            changedByName: req.user.fullName || 'Admin',
            note: paymentNotes || `Payment details updated by admin`,
          });

          await order.save();
          return res.json({ message: 'Payment details updated successfully', data: order });
        }
      } catch (dbErr) {
        console.warn('[orders/:id/payment] DB update failed, using memory fallback:', dbErr.message);
      }
    }

    // Memory fallback
    const orderIndex = memory.findIndex((o) => o.id === id || o.orderNumber === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = memory[orderIndex];
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
    if (paymentAmount !== undefined) order.paymentAmount = Number(paymentAmount) || 0;
    if (paymentMethod !== undefined) order.paymentMethod = paymentMethod;
    if (paymentDate !== undefined) order.paymentDate = paymentDate;
    if (paymentNotes !== undefined) order.paymentNotes = paymentNotes;

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: `Payment: ${order.paymentStatus} (₹${order.paymentAmount})`,
      changedAt: new Date(),
      changedByName: req.user.fullName || 'Admin',
      note: paymentNotes || 'Payment details updated',
    });
    order.updatedAt = new Date().toISOString();

    return res.json({ message: 'Payment details updated successfully', data: order });
  } catch (err) {
    console.error('[orders/:id/payment] Error:', err);
    return res.status(500).json({ error: 'Failed to update payment info' });
  }
});

export default router;
