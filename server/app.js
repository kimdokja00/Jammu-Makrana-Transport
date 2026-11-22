import express from 'express';
import cors from 'cors';

import { isDbConfigured, connectDb } from './lib/db.js';
import stonesRouter from './routes/stones.js';
import enquiriesRouter from './routes/enquiries.js';
import ordersRouter from './routes/orders.js';
import authRouter from './routes/auth.js';

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * Support both `/api/*` and direct `/*` routes so that whether Vercel or
 * a local reverse proxy preserves the `/api` prefix or strips it, Express
 * always matches the route seamlessly.
 */
app.use((req, _res, next) => {
  const raw = (req.headers && req.headers['x-matched-path']) || req.originalUrl;
  if ((req.url === '/api' || req.url === '/api/' || req.url === '/api/index.js') && raw && raw !== req.url) {
    req.url = raw;
  }
  next();
});

const healthHandler = async (_req, res) => {
  let database = 'not-configured';
  if (isDbConfigured()) {
    try {
      await connectDb();
      database = 'connected';
    } catch (err) {
      database = `error: ${err.message}`;
    }
  }
  res.json({ status: 'ok', database, time: new Date().toISOString() });
};

// Direct routes (/health, /auth, /stones, /enquiries, /orders)
app.get('/health', healthHandler);
app.use('/auth', authRouter);
app.use('/stones', stonesRouter);
app.use('/enquiries', enquiriesRouter);
app.use('/orders', ordersRouter);

// Prefixed routes (/api/health, /api/auth, /api/stones, /api/enquiries, /api/orders)
app.get('/api/health', healthHandler);
app.use('/api/auth', authRouter);
app.use('/api/stones', stonesRouter);
app.use('/api/enquiries', enquiriesRouter);
app.use('/api/orders', ordersRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[api] unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
