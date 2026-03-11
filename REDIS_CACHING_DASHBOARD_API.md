## Redis caching (Dashboard API) — Simple guide

This project can use **Redis** to make the dashboard faster.

Redis is used by the **Dashboard API** (`services/dashboard-api`).  
The **Dashboard MFE (frontend)** does not need changes to benefit from Redis.

---

## What Redis does here (in simple words)

- When you open the dashboard, the Dashboard API needs data (portfolio/bank).
- The API gets the data from the main backend (LoopBack).
- At the same time, the API also saves a copy in Redis for a short time.
- If you open the dashboard again soon, the API can return the saved copy from Redis (faster).

Redis data is **temporary**. After some time it expires automatically.

---

## What is cached

These endpoints are cached:

- `GET /api/dashboard/:clientId/portfolio`
- `GET /api/dashboard/:clientId/bank`

The cache is based on:

- `clientId`
- `fromDate`
- `currencyId`
- `contextFilter`

If these values change, Redis creates a different cache entry.

---

## How long it stays cached (TTL)

`CACHE_TTL_SECONDS` controls how long Redis keeps the data.

- Example: `300` seconds = **5 minutes**

---

## Start Redis (macOS) — without Docker

If you don’t have Docker, use Homebrew.

1) Install and start Redis:

```bash
brew --version
brew install redis
brew services start redis
```

2) Verify Redis is running:

```bash
redis-cli ping
```

You should see:

```bash
PONG
```

---

## Enable Redis for the Dashboard API

1) Go to the Dashboard API:

```bash
cd services/dashboard-api
```

2) Create your env file:

```bash
cp .env.example .env
```

3) In `services/dashboard-api/.env`, set:

- `REDIS_URL=redis://localhost:6379`
- `CACHE_TTL_SECONDS=300`

4) Start the API:

```bash
npm run dev
```

---

## How to verify caching is working

### A) Check keys in Redis (quick check)

After you load the dashboard once (or hit the API once), run:

```bash
redis-cli KEYS "dashboard:*"
```

You should see keys like:

- `dashboard:portfolio:201:2025-01-01:247:...`
- `dashboard:bank:201:2025-01-01:247:...`

### B) Check TTL (optional)

```bash
redis-cli TTL "dashboard:portfolio:201:2025-01-01:247:{\"custodialAccountId\":[1]}"
```

It returns remaining seconds until expiry.

### C) Strong proof (optional)

1) Call the same endpoint twice (same query params).
2) The second call should be faster.
3) If LoopBack is temporarily unavailable, but you still get a successful response within TTL, that response is coming from Redis cache.

---

## If Redis is not running

Nothing breaks.

- The Dashboard API will still work.
- It will just fetch from LoopBack every time (no caching).

