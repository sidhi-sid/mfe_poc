# Redis Caching Implementation

This document describes the Redis caching layer for the **dashboard-api** and **oms-api** microservices in the MFE POC. Redis is used to cache read-heavy, proxy-backed responses to reduce latency and load on the upstream LoopBack API.

---

## 1. Scope

| Service        | Location                    | Caching scope                          |
|----------------|-----------------------------|----------------------------------------|
| **dashboard-api** | `services/dashboard-api/`   | GET endpoints that proxy to LoopBack   |
| **oms-api**       | `services/oms-api/`         | GET instruments list and by-id         |

Other apps in the repo (core, dashboard MFE, OMS MFE, iframe-host) do **not** use Redis; only the two Fastify APIs above do.

---

## 2. Requirements (Validated)

### 2.1 Functional

- **dashboard-api**: Cache responses for:
  - `GET /api/dashboard/:clientId/portfolio` (query: fromDate, currencyId, contextFilter)
  - `GET /api/dashboard/:clientId/bank` (same query params)
  - `GET /api/dashboard/:clientId` (dashboard data; query as-is)
  - `GET /api/dashboard/:clientId/:action` (GET-only actions)
  - `GET /api/onboarding/getWMURL` (query: cifNumber, accountType)
  - `GET /api/account/fetchAccountByCifNumber` (query: cifNumber)
- **oms-api**: Cache responses for:
  - `GET /api/instruments` (optional query: search)
  - `GET /api/instruments/:id`
- **No cache** for:
  - POST/PUT/PATCH/DELETE (e.g. `POST /api/onboarding/authSelfOnboarding`, `POST /api/orders`).
  - Health/root routes.

### 2.2 Non-Functional

- **Configurable**: Redis connection via env (e.g. `REDIS_URL`); TTL via env (e.g. `REDIS_TTL_SECONDS`).
- **Resilient**: If Redis is unavailable, APIs continue to work by skipping cache (read-through miss, direct upstream call).
- **Key design**: Cache keys must be deterministic (same request → same key) and namespaced per service to avoid collisions if both use the same Redis instance.

---

## 3. Cache Strategy

### 3.1 Key Format

- **dashboard-api**: `dashboard:{pathId}:{hash(query)}`
  - Examples:
    - Portfolio: `dashboard:portfolio:{clientId}:{hash(fromDate,currencyId,contextFilter,widgets)}`
    - Bank: `dashboard:bank:{clientId}:{hash(...)}`
    - Dashboard data: `dashboard:data:{clientId}:{hash(query)}`
    - WM URL: `dashboard:wmurl:{hash(cifNumber,accountType)}`
    - Account by CIF: `dashboard:account:cif:{cifNumber}`
- **oms-api**: `oms:instruments:list:{searchOrEmpty}` and `oms:instruments:id:{id}`.

### 3.2 TTL

- Default: **300 seconds (5 minutes)**. Override with `REDIS_TTL_SECONDS`.
- dashboard-api proxy responses can use the same default; optionally use a longer TTL for reference data (e.g. getWMURL, fetchAccountByCifNumber) via a separate env (e.g. `REDIS_TTL_LONG_SECONDS`) if needed later.

### 3.3 Invalidation

- **Time-based only** for this phase: entries expire after TTL. No explicit invalidation on write (e.g. after placing an order) in the initial implementation.
- Optional later: delete keys on specific POST/PUT (e.g. invalidate dashboard keys for a clientId when a relevant action is performed).

---

## 4. Configuration

Both services support the same env vars:

| Variable              | Description                    | Default        |
|-----------------------|--------------------------------|----------------|
| `REDIS_URL`           | Redis connection URL           | `redis://localhost:6379` |
| `REDIS_TTL_SECONDS`   | Default TTL for cached entries | `300`          |
| `REDIS_ENABLED`       | Turn caching on/off            | `true`         |

If `REDIS_ENABLED=false` or Redis is unreachable, the service skips cache and calls upstream only.

---

## 5. Implementation Approach

1. **Shared pattern (both services)**
   - Add dependency: `ioredis`.
   - Add a small **cache helper** (e.g. `lib/cache.js` or `utils/redis.js`):
     - `get(key)` → parsed JSON or `null`
     - `set(key, value, ttlSeconds)` → store JSON
     - `connect()` / `disconnect()` for lifecycle.
   - On startup: connect to Redis (optional; log warning and disable cache on failure).
   - On shutdown: disconnect gracefully.

2. **dashboard-api**
   - Build a **cache key** from route + params + normalized query.
   - Before calling `proxyToLoopback` for a GET, check cache; on hit return cached response (status + data).
   - On miss: call `proxyToLoopback`, then store status + data in cache and return.
   - Use Fastify lifecycle (e.g. `fastify.addHook('onClose', ...)`) to close Redis.

3. **oms-api**
   - **listInstruments**: cache key `oms:instruments:list:{search ?? ''}`.
   - **getInstrumentById**: cache key `oms:instruments:id:{id}`.
   - Same pattern: check cache → on hit return; on miss compute, set, return.

---

## 6. Running Redis

### Local (macOS)

```bash
# Install (Homebrew)
brew install redis
brew services start redis

# Or run in foreground
redis-server
```

### Docker

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### Verify

```bash
redis-cli ping
# PONG
```

---

## 7. File Changes Summary

| Service        | Files to add/change |
|----------------|---------------------|
| **dashboard-api** | `config.js` (redis settings), `lib/redis-cache.js` (new), `controllers/dashboardController.js` (cache get/set around proxy), `server.js` (register cache, onClose) |
| **oms-api**       | `config.js` (redis settings), `lib/redis-cache.js` (new), `controllers/instrumentsController.js` (cache list + getById), `server.js` (register cache, onClose) |

All paths are relative to `services/dashboard-api/` and `services/oms-api/` respectively.

---

## 8. Testing

- With Redis down or `REDIS_ENABLED=false`: both APIs should behave as before (no cache).
- With Redis up: repeat same GET request; first call hits upstream, second returns from cache (e.g. check response time or Redis `GET` keys).
- Optional: use `redis-cli MONITOR` to see cache get/set while calling the APIs.

---

## 9. References

- [ioredis](https://github.com/redis/ioredis) — Redis client for Node.js
- [Fastify lifecycle](https://fastify.dev/docs/latest/Reference/Lifecycle/) — for `onClose` and cleanup
