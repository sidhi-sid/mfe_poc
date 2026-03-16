'use strict';

const Redis = require('ioredis');
const config = require('../config');

let client = null;
let enabled = false;

function hashQuery(query) {
  if (!query || Object.keys(query).length === 0) return '';
  const sorted = Object.keys(query)
    .sort()
    .map((k) => `${k}=${query[k]}`)
    .join('&');
  return Buffer.from(sorted).toString('base64url');
}

function buildKey(prefix, parts) {
  const segment = parts.filter(Boolean).join(':');
  return `dashboard:${prefix}:${segment}`;
}

async function connect() {
  if (!config.redis.enabled) return false;
  try {
    client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 2,
      retryStrategy() {
        return null;
      },
      lazyConnect: true,
    });
    await client.connect();
    enabled = true;
    return true;
  } catch (err) {
    console.warn('Redis connect failed, caching disabled:', err.message);
    if (client) {
      try {
        client.disconnect();
      } catch (_) {}
      client = null;
    }
    enabled = false;
    return false;
  }
}

async function get(key) {
  if (!enabled || !client) return null;
  try {
    const raw = await client.get(key);
    if (raw == null) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

async function set(key, value, ttlSeconds) {
  if (!enabled || !client) return;
  const ttl = ttlSeconds ?? config.redis.ttlSeconds;
  try {
    await client.setex(key, ttl, JSON.stringify(value));
  } catch (_) {
    // ignore
  }
}

async function disconnect() {
  if (client) {
    try {
      client.disconnect();
    } catch (_) {}
    client = null;
  }
  enabled = false;
}

function isEnabled() {
  return enabled && !!client;
}

module.exports = {
  connect,
  disconnect,
  get,
  set,
  isEnabled,
  buildKey,
  hashQuery,
  defaultTtl: config.redis.ttlSeconds,
};
