'use strict';

const memjs = require('memjs');
const zlib = require('zlib');
const { promisify } = require('util');
const config = require('./config');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

let client = null;

/**
 * Returns the singleton Memcached client, creating it on first call.
 * If Memcached is unavailable, errors are caught per-operation so the
 * API continues to work without cache (graceful degradation).
 */
function getClient() {
  if (!client) {
    client = memjs.Client.create(config.memcachedUrl, {
      failover: false,
      timeout: 1,    // 1 second connect timeout
      retries: 1,
    });
  }
  return client;
}

/**
 * Fetch a cached value by key.
 * Returns parsed JSON object, or null on miss / error.
 */
async function getCache(key) {
  try {
    const { value } = await getClient().get(key);
    if (!value) return null;
    const decompressed = await gunzip(value);
    return JSON.parse(decompressed.toString());
  } catch (err) {
    console.warn(`[cache] GET "${key}" failed:`, err.message);
    return null;
  }
}

/**
 * Store a value in Memcached, gzip-compressed to stay within the 1MB limit.
 * @param {string} key
 * @param {*} data  - will be JSON-serialised then compressed
 * @param {number} ttl - seconds until expiry (default from config)
 */
async function setCache(key, data, ttl = config.cacheTTL) {
  try {
    const compressed = await gzip(JSON.stringify(data));
    await getClient().set(key, compressed, { expires: ttl });
  } catch (err) {
    console.warn(`[cache] SET "${key}" failed:`, err.message);
  }
}

/**
 * Delete a specific key from Memcached (manual invalidation).
 */
async function deleteCache(key) {
  try {
    await getClient().delete(key);
  } catch (err) {
    console.warn(`[cache] DELETE "${key}" failed:`, err.message);
  }
}

module.exports = { getCache, setCache, deleteCache };
