/**
 * Seed the stone range catalogue into MongoDB Atlas.
 *
 *   npm run seed            # upsert every stone by slug
 *   npm run seed -- --fresh # drop the collection first, then insert
 *
 * Reads MONGODB_URI from .env.local or the process environment.
 */
import mongoose from 'mongoose';
import { loadEnv } from './lib/env.js';

loadEnv();

const { stones } = await import('./data/stones.js');
const { Stone } = await import('./models/Stone.js');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI is not set. Copy .env.example to .env.local and add your Atlas string.');
  process.exit(1);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB.');

  if (process.argv.includes('--fresh')) {
    await Stone.deleteMany({});
    console.log('Cleared existing stones.');
  }

  const ops = stones.map((stone) => ({
    updateOne: {
      filter: { slug: stone.slug },
      update: { $set: stone },
      upsert: true,
    },
  }));

  const result = await Stone.bulkWrite(ops);
  console.log(
    `Seeded stones -> upserted: ${result.upsertedCount}, updated: ${result.modifiedCount}, matched: ${result.matchedCount}`
  );

  const total = await Stone.countDocuments();
  console.log(`Collection "${Stone.collection.name}" now holds ${total} stones.`);

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
} catch (err) {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
}
