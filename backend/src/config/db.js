import mongoose from 'mongoose';
import Product from '../models/Product.js';

/**
 * Reuse one connection across Vercel warm invocations. A new connect() on
 * every request races with in-flight queries and triggers mongoose buffering
 * timeouts (`products.find()` after 10000ms).
 */
const globalCache = globalThis;
if (!globalCache.__mongoose) {
  globalCache.__mongoose = { conn: null, promise: null, indexesReady: false };
}

/**
 * Product display and merchandising data is deliberately non-unique. MongoDB
 * retains indexes after a schema changes, so remove legacy unique Product
 * indexes at startup. `slug` is the sole exception: it is an internal route
 * identifier and the Product hook guarantees a unique value for it.
 */
async function reconcileProductIndexes() {
  if (globalCache.__mongoose.indexesReady) return;

  let indexes = [];
  try {
    indexes = await Product.collection.indexes();
  } catch (err) {
    // A fresh database has no products collection yet; createIndexes below
    // will create it and establish the declared indexes.
    if (err.code !== 26) throw err;
  }
  const obsoleteUniqueIndexes = indexes.filter((index) => {
    if (!index.unique || index.name === '_id_') return false;
    const fields = Object.keys(index.key);
    return !(fields.length === 1 && fields[0] === 'slug' && index.key.slug === 1);
  });

  for (const index of obsoleteUniqueIndexes) {
    try {
      await Product.collection.dropIndex(index.name);
      console.log(`Removed obsolete unique Product index: ${index.name}`);
    } catch (err) {
      // Multiple application instances can reconcile concurrently. If another
      // instance removed the index first, the desired state has been reached.
      if (err.code !== 27) throw err;
    }
  }

  // Recreate the declared slug and catalogue query indexes after cleanup.
  await Product.createIndexes();
  globalCache.__mongoose.indexesReady = true;
}

export default async function connectDB() {
  const uri = process.env.MONGO_URI?.trim();
  if (!uri) {
    throw new Error(
      'MONGO_URI is not set. Add it in Vercel → Project → Settings → Environment Variables.'
    );
  }

  if (mongoose.connection.readyState === 1 && globalCache.__mongoose.conn) {
    return globalCache.__mongoose.conn;
  }

  if (!globalCache.__mongoose.promise) {
    mongoose.set('bufferCommands', false);
    globalCache.__mongoose.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 20000,
      maxPoolSize: 10,
      // Vercel often prefers IPv6; Atlas hostnames frequently fail on IPv6.
      family: 4,
    });
  }

  try {
    const conn = await globalCache.__mongoose.promise;
    globalCache.__mongoose.conn = conn;
    await reconcileProductIndexes();
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    globalCache.__mongoose.promise = null;
    globalCache.__mongoose.conn = null;
    console.error(`MongoDB connection error: ${err.message}`);
    throw err;
  }
}
