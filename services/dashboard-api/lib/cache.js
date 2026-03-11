'use strict';

const { getClient } = require('./redis');
const config = require('../config');

const PREFIX = 'dashboard:';

/**
 * Get a cached value. Returns parsed JSON or null on miss/error.
 * @param {string} key - Cache key (without prefix).
 * @returns {Promise<{ status: number, data: any } | null>}
 */
async function get(key) {
  const redis = getClient();
  if (!redis) return null;
  try {
    const fullKey = PREFIX + key;
    const raw = await redis.get(fullKey);
    if (raw == null) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

/**
 * Set a cached value with TTL.
 * @param {string} key - Cache key (without prefix).
 * @param {{ status: number, data: any }} value - Object to store (status + data).
 * @param {number} [ttlSeconds] - TTL in seconds; defaults to config.cacheTtlSeconds.
 */
async function set(key, value, ttlSeconds) {
  const redis = getClient();
  if (!redis) return;
  const ttl = ttlSeconds ?? config.cacheTtlSeconds;
  try {
    const fullKey = PREFIX + key;
    const serialized = JSON.stringify(value);
    if (ttl > 0) {
      await redis.setex(fullKey, ttl, serialized);
    } else {
      await redis.set(fullKey, serialized);
    }
  } catch (err) {
    // no-op on set failure
  }
}

/**
 * Build a cache key from endpoint and query params.
 * @param {string} endpoint - e.g. 'portfolio', 'bank'
 * @param {string} clientId
 * @param {string} [fromDate]
 * @param {string} [currencyId]
 * @param {string} [contextFilter]
 */
function buildKey(endpoint, clientId, fromDate, currencyId, contextFilter) {
  const from = fromDate || '2025-01-01';
  const curr = currencyId || '247';
  const ctx = contextFilter || JSON.stringify({ custodialAccountId: [1] });
  return `${endpoint}:${clientId}:${from}:${curr}:${ctx}`;
}

module.exports = { get, set, buildKey };
