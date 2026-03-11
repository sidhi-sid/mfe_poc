'use strict';

const Redis = require('ioredis');
const config = require('../config');

let client = null;

/**
 * Optional Redis client. If REDIS_URL is empty or connection fails,
 * getClient() returns null and the app runs without caching.
 */
function getClient() {
  if (client) return client;
  const url = (config.redisUrl || '').trim();
  if (!url) return null;
  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true,
    });
    console.log("client ==> ", client);
    client.on('error', (err) => {
      console.warn('[dashboard-api] Redis error:', err.message);
    });
    return client;
  } catch (err) {
    console.warn('[dashboard-api] Redis init failed:', err.message);
    return null;
  }
}

async function close() {
  if (client) {
    await client.quit();
    client = null;
  }
}

module.exports = { getClient, close };
