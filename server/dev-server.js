/**
 * Local development entry point.
 *
 * Vercel runs `api/index.js` as a serverless function and never calls listen(),
 * so this file provides the same app on a real port for `npm run dev:api`.
 * Vite proxies /api -> http://localhost:5000 (see vite.config.js).
 */
import { loadEnv } from './lib/env.js';

// Must run before ./lib/db.js is imported, since it reads MONGODB_URI at module load.
const loaded = loadEnv();

const { default: app } = await import('./app.js');
const { isDbConfigured, connectDb } = await import('./lib/db.js');

const port = process.env.PORT || 5000;

app.listen(port, async () => {
  console.log(`\n  Jammu Makrana API  ->  http://localhost:${port}`);  console.log(`  Health             ->  http://localhost:${port}/api/health`);

  if (loaded.length) console.log(`  Env files          ->  ${loaded.join(', ')}`);

  if (!isDbConfigured()) {
    console.log('  MongoDB            ->  not configured (serving bundled catalogue)\n');
    return;
  }

  try {
    await connectDb();
    console.log('  MongoDB            ->  connected\n');
  } catch (err) {
    console.log(`  MongoDB            ->  connection FAILED: ${err.message}\n`);
  }
});
