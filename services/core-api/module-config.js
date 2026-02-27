'use strict';

const config = require('./config');

const CACHE_TTL_MS = 60 * 1000;
let cache = null;
let cacheExpiry = 0;

async function getModuleConfig() {
  const url = config.moduleJsonUrl;
  if (!url || url.trim() === '') {
    return { modules: [] };
  }

  const now = Date.now();
  if (cache !== null && cacheExpiry > now) {
    return cache;
  }
  console.log("url ==>> ", url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch module config: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const result = { modules: Array.isArray(data.modules) ? data.modules : [] };

  cache = result;
  cacheExpiry = now + CACHE_TTL_MS;
  return result;
}

module.exports = { getModuleConfig };
