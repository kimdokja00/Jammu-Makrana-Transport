import mongoose from 'mongoose';

/**
 * Mongoose connection helper.
 *
 * Vercel runs each API invocation in a serverless function, so we cache the
 * connection on `globalThis` to avoid opening a new pool on every cold start /
 * request (which would exhaust Mongo Atlas' connection limit).
 */

const MONGODB_URI = process.env.MONGODB_URI;

let cached = globalThis.__jmtMongoose;

if (!cached) {
  cached = globalThis.__jmtMongoose = { conn: null, promise: null };
}

/** True when MONGODB_URI is present in the environment. */
export function isDbConfigured() {
  return Boolean(MONGODB_URI);
}

/**
 * Resolve a live Mongoose connection.
 * Returns `null` when MONGODB_URI is not configured so the API can fall back to
 * bundled seed data instead of crashing.
 */
export async function connectDb() {
  if (!MONGODB_URI) return null;
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectDb;
