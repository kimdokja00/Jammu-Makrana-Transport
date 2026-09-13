import { Router } from 'express';
import { connectDb, isDbConfigured } from '../lib/db.js';
import Stone from '../models/Stone.js';
import { stones as fallbackStones } from '../data/stones.js';

const router = Router();

/**
 * GET /api/stones
 * Optionally filter with ?category=Granite or ?featured=true
 */
router.get('/', async (req, res) => {
  const { category, featured } = req.query;

  const applyFilters = (list) =>
    list
      .filter((s) => (category ? s.category.toLowerCase() === String(category).toLowerCase() : true))
      .filter((s) => (featured ? Boolean(s.featured) === (String(featured) === 'true') : true))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  try {
    if (isDbConfigured()) {
      await connectDb();
      const docs = await Stone.find().lean({ virtuals: false });
      if (docs.length) {
        const data = applyFilters(docs);
        return res.json({ source: 'mongodb', count: data.length, total: docs.length, data });
      }
    }
  } catch (err) {
    console.error('[stones] MongoDB read failed, using bundled catalogue:', err.message);
  }

  // Falls back here when Atlas is not configured yet or the collection is empty.
  const data = applyFilters(fallbackStones);
  return res.json({
    source: 'bundled',
    count: data.length,
    total: fallbackStones.length,
    data,
  });
});

/** GET /api/stones/:slug */
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    if (isDbConfigured()) {
      await connectDb();
      const doc = await Stone.findOne({ slug }).lean({ virtuals: false });
      if (doc) return res.json({ source: 'mongodb', data: doc });
    }
  } catch (err) {
    console.error('[stones] MongoDB lookup failed, using bundled catalogue:', err.message);
  }

  const stone = fallbackStones.find((s) => s.slug === slug);
  if (!stone) return res.status(404).json({ error: 'Stone not found', slug });

  return res.json({ source: 'bundled', data: stone });
});

export default router;
