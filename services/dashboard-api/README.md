# Dashboard API

Fastify-based backend service for the Dashboard MFE. Acts as an authenticated proxy between the React frontend and the LoopBack (LB) core banking API, with Memcached server-side caching.

---

## Architecture

```
Browser (Dashboard MFE)
        │  HTTP fetch
        ▼
Dashboard API  (Fastify · port 4001)
        │
        ├─ Auth Plugin  →  validates Bearer token on every request
        │
        ├─ Memcached    →  cache-aside for /portfolio and /bank
        │       HIT  ──────────────────────────► return cached JSON
        │       MISS  ──► LoopBack API ──► store in cache ──► return JSON
        │
        └─ lb-proxy.js  →  forwards requests to LoopBack API
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| Memcached | any recent |

**Install and start Memcached (macOS):**
```bash
brew install memcached
memcached -p 11211 -d
```

**Install and start Memcached (Ubuntu/Debian):**
```bash
sudo apt install memcached
sudo systemctl start memcached
```

---

## Setup

```bash
cd services/dashboard-api
npm install
cp .env.example .env   # fill in your values
npm run dev
```

---

## Caching

Caching is implemented server-side using **Memcached** via the [`memjs`](https://github.com/memjs/memjs) client.

### Cache-aside pattern

```
1. Request arrives
2. Build cache key → "portfolio:201:2025-01-01:247"
3. Check Memcached
   HIT  → return cached JSON (no LoopBack call)
   MISS → call LoopBack API → store response → return JSON
```

---

## Code Explanation — Changed Files

### `config.js` — added Memcached config

```js
memcachedUrl: process.env.MEMCACHED_URL || 'localhost:11211',
cacheTTL: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
```
Two new env-driven values added to the central config object:
- `memcachedUrl` — address of the Memcached server. Override via `MEMCACHED_URL` env var for staging/production.
- `cacheTTL` — how long (in seconds) a cached response stays valid before it expires and the next request re-fetches from LoopBack. Defaults to 300s (5 minutes).

---

### `cache.js` — new file, Memcached helper

```js
const gzip   = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
```
Node's built-in `zlib` is used to compress/decompress values. This is necessary because Memcached has a **1MB per-item limit** and the portfolio API response exceeds it. Gzip typically reduces JSON by 60–80%.

```js
function getClient() {
  if (!client) {
    client = memjs.Client.create(config.memcachedUrl, {
      failover: false, timeout: 1, retries: 1,
    });
  }
  return client;
}
```
Creates a **singleton** Memcached client — one connection shared for the lifetime of the process. `timeout: 1` means if Memcached doesn't respond within 1 second, the operation fails fast and the request falls through to LoopBack.

```js
async function getCache(key) {
  const { value } = await getClient().get(key);
  if (!value) return null;                        // cache MISS
  const decompressed = await gunzip(value);
  return JSON.parse(decompressed.toString());     // cache HIT
}
```
Fetches a value from Memcached, gunzips it, and parses the JSON. Returns `null` on a miss so the caller knows to fetch fresh data.

```js
async function setCache(key, data, ttl = config.cacheTTL) {
  const compressed = await gzip(JSON.stringify(data));
  await getClient().set(key, compressed, { expires: ttl });
}
```
Serialises the response to JSON, compresses it with gzip, then stores it in Memcached with a TTL. All errors are caught silently — if Memcached is down, the API continues without caching.

```js
async function deleteCache(key) {
  await getClient().delete(key);
}
```
Used by the cache invalidation endpoint to force-remove a specific key before its TTL expires.

---

### `controllers/dashboardController.js` — cache-aside added to `getPortfolio` and `getBank`

```js
const cacheKey = `portfolio:${clientId}:${fromDate}:${currencyId}`;

const cached = await getCache(cacheKey);
if (cached) return reply.send(cached);           // HIT — skip LoopBack entirely
```
A unique cache key is built from the request parameters so different clients and date ranges never share the same cached entry. On a HIT, the response is returned immediately without touching the LoopBack API.

```js
const result = await proxyToLoopback({ ... });

if (result.status === 200) {
  await setCache(cacheKey, result.data);         // store only on success
}
reply.code(result.status).send(result.data);
```
On a MISS, the request goes to LoopBack as normal. The response is only cached if the status is `200` — errors (401, 500, etc.) are never stored in the cache.

```js
async function invalidateClientCache(request, reply) {
  await Promise.all([
    deleteCache(`portfolio:${clientId}:${fromDate}:${currencyId}`),
    deleteCache(`bank:${clientId}:${fromDate}:${currencyId}`),
  ]);
  reply.send({ invalidated: true, clientId });
}
```
Admin handler for `DELETE /api/dashboard/:clientId/cache`. Deletes both portfolio and bank keys for a client in parallel, forcing the next request to re-fetch live data from LoopBack.

---

### `routes/dashboard.js` — one new route added

```js
fastify.delete('/dashboard/:clientId/cache', dashboardController.invalidateClientCache);
```
Registers the cache invalidation endpoint. Uses `DELETE` method (semantically correct — you are removing a resource from the cache). Must be declared **before** the `/:action` wildcard route to avoid being swallowed by it.
