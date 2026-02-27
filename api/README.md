# MFE Backend — Microservices Architecture

Three independent Fastify microservices for the MFE POC application, connected to a LoopBack 3 backend via API proxy.

## Architecture

```
api/
├── package.json          ← npm workspaces root
├── shared/               ← @mfe/shared — shared utilities package
│   ├── config.js         ← LoopBack config, CORS origins
│   ├── auth-plugin.js    ← Auth token handler
│   ├── lb-proxy.js       ← LoopBack proxy helper
│   ├── logger.js         ← Pino logger factory
│   ├── errors.js         ← AppError + error handler plugin
│   ├── graceful-shutdown.js
│   └── middleware/       ← Request-ID, Response-Time
│
├── oms/                  ← Order Management System (port 4002)
│   ├── app.js            ← Fastify app factory
│   ├── server.js         ← Entry point
│   ├── routes/           ← instruments, proxy
│   └── services/         ← Business logic
│
└── dashboard/            ← Dashboard (port 4001)
    ├── app.js            ← Fastify app factory
    ├── server.js         ← Entry point
    ├── routes/           ← dashboard
    └── services/         ← Business logic
```

## Quick Start

### 1. Install all dependencies (from `api/` root)

```bash
npm install
```

This installs dependencies for **all three workspaces** and symlinks `@mfe/shared` automatically.

### 2. Configure environment

```bash
# Copy env templates
cp oms/.env.example oms/.env
cp dashboard/.env.example dashboard/.env
```

Edit each `.env` with your LoopBack token and cookie.

### 3. Run services

```bash
# Run both services
npm run dev:all

# Or individually
npm run dev:oms        # → http://localhost:4002
npm run dev:dashboard  # → http://localhost:4001
```

## Service Ports

| Service   | Port | Health Check                      |
|-----------|------|-----------------------------------|
| OMS       | 4002 | `GET http://localhost:4002/health` |
| Dashboard | 4001 | `GET http://localhost:4001/health` |

## API Endpoints

### OMS (port 4002)
- `GET  /api/instruments` — List instruments (supports `?search=`)
- `GET  /api/instruments/:id` — Single instrument
- `POST /api/orders` — Place an order
- `*    /api/lb/*` — Generic LoopBack proxy

### Dashboard (port 4001)
- `GET /api/dashboard/:clientId/portfolio` — Portfolio overview
- `GET /api/dashboard/:clientId/bank` — Bank details
- `GET /api/dashboard/:clientId` — Generic dashboard data
- `GET /api/dashboard/:clientId/:action` — Any ClientDashboard action

## Adding a New Microservice

1. Create a new directory under `api/` (e.g., `api/reporting/`)
2. Add `package.json` with `"@mfe/shared": "*"` dependency
3. Copy the `app.js` / `server.js` pattern from OMS or Dashboard
4. Add the workspace to root `package.json`:
   ```json
   "workspaces": ["shared", "oms", "dashboard", "reporting"]
   ```
5. Run `npm install` from root to link everything
