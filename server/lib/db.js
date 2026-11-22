import mongoose from 'mongoose';

/**
 * Mongoose connection helper.
 *
 * Vercel runs each API invocation in a serverless function, so we cache the
 * connection on `globalThis` to avoid opening a new pool on every cold start /
 * request (which would exhaust Mongo Atlas' connection limit).
 */

let cached = globalThis.__jmtMongoose;

if (!cached) {
  cached = globalThis.__jmtMongoose = { conn: null, promise: null };
}

/**
 * Clean and normalize the MongoDB URI string.
 * Strips accidental surrounding quotes ("...", '...'),
 * any leading 'MONGODB_URI = ', and ensures a database name.
 */
export function getSanitizedUri() {
  const raw = process.env.MONGODB_URI;
  if (!raw) return null;
  let uri = String(raw).trim();
  uri = uri.replace(/^MONGODB_URI\s*=\s*/i, '').trim();
  uri = uri.replace(/^["'`]+|["'`]+$/g, '').trim();
  try {
    const parsed = new URL(uri);
    if (!parsed.pathname || parsed.pathname === '/') {
      parsed.pathname = '/makrana_transportation';
      uri = parsed.toString();
    }
  } catch (_e) {
    // If not a standard URL, fall back to the unquoted string
  }
  return uri || null;
}

/** True when MONGODB_URI is present in the environment. */
export function isDbConfigured() {
  return Boolean(getSanitizedUri());
}

/**
 * Resolve a live Mongoose connection.
 * Returns `null` when MONGODB_URI is not configured so the API can fall back to
 * bundled seed data instead of crashing.
 */
export async function connectDb() {
  const uri = getSanitizedUri();
  if (!uri) return null;
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
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
