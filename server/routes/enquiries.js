import { Router } from 'express';
import { connectDb, isDbConfigured } from '../lib/db.js';
import Enquiry from '../models/Enquiry.js';
import { authMiddleware, adminOnly } from '../lib/auth.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory fallback so the contact form still works before Atlas is wired up.
const memory = globalThis.__jmtEnquiries || (globalThis.__jmtEnquiries = []);

/**
 * POST /api/enquiries
 * Body: { name, email, phone, subject, message, stoneOfInterest? }
 */
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message, stoneOfInterest } = req.body ?? {};

  const errors = {};
  if (!name?.trim()) errors.name = 'Name is required';
  if (!email?.trim() || !EMAIL_RE.test(email.trim())) errors.email = 'A valid email is required';
  if (!phone?.trim()) errors.phone = 'Phone is required';
  if (!subject?.trim()) errors.subject = 'Subject is required';
  if (!message?.trim() || message.trim().length < 10) {
    errors.message = 'Please tell us a little more (10+ characters)';
  }

  if (Object.keys(errors).length) {
    return res.status(400).json({ error: 'Validation failed', errors });
  }

  const payload = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    subject: subject.trim(),
    message: message.trim(),
    stoneOfInterest: stoneOfInterest?.trim() || '',
    status: 'new',
  };

  try {
    if (isDbConfigured()) {
      await connectDb();
      const created = await Enquiry.create(payload);
      return res.status(201).json({ source: 'mongodb', data: created });
    }
  } catch (err) {
    console.error('[enquiries] MongoDB write failed:', err.message);
    return res.status(503).json({ error: 'Could not save your enquiry. Please call or email us.' });
  }

  const record = { ...payload, id: `local-${memory.length + 1}`, createdAt: new Date().toISOString() };
  memory.push(record);
  return res.status(201).json({ source: 'memory', data: record });
});

/**
 * Middleware: allow JWT admin OR legacy ADMIN_TOKEN header
 */
const adminAuth = (req, res, next) => {
  const legacyToken = process.env.ADMIN_TOKEN;
  if (legacyToken && req.get('x-admin-token') === legacyToken) {
    return next();
  }
  // Try JWT auth
  return authMiddleware(req, res, () => {
    return adminOnly(req, res, next);
  });
};

/**
 * GET /api/enquiries
 * Returns all customer enquiries for Admin Console
 */
router.get('/', adminAuth, async (_req, res) => {
  try {
    if (isDbConfigured()) {
      await connectDb();
      const data = await Enquiry.find().sort({ createdAt: -1 }).limit(200);
      return res.json({ count: data.length, data });
    }
  } catch (err) {
    console.error('[enquiries/get] DB error:', err.message);
  }

  return res.json({ count: memory.length, data: [...memory].reverse() });
});

/**
 * PATCH /api/enquiries/:id
 * Admin updates enquiry status ('new' | 'contacted' | 'closed')
 */
router.patch('/:id', adminAuth, async (req, res) => {
  const { status } = req.body ?? {};
  const valid = ['new', 'contacted', 'closed'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    if (isDbConfigured()) {
      await connectDb();
      const updated = await Enquiry.findByIdAndUpdate(
        req.params.id,
        { $set: { status } },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Enquiry not found' });
      return res.json({ data: updated });
    }
  } catch (err) {
    console.error('[enquiries/patch] DB error:', err.message);
  }

  const item = memory.find((e) => e.id === req.params.id || e._id === req.params.id);
  if (item) {
    item.status = status;
    return res.json({ data: item });
  }
  return res.status(404).json({ error: 'Enquiry not found' });
});

export default router;
