# MFE POC — Microfrontend Proof of Concept
 
A monorepo containing three independent React + Vite microfrontend applications.
 
## Projects
 
| Project | Description | Path |
|---------|-------------|------|
| **Dashboard** | Dashboard microfrontend | [`dashboard/`](./dashboard) |
| **Core** | Core/shared microfrontend module | [`core/`](./core) |
| **OMS** | Order Management System microfrontend | [`oms/`](./oms) |
 
## Dynamic modules (Core)

The Core app reads **`core/public/module.json`** to build the navbar and routes. Only MFEs that are **up and reachable** are shown in the sidebar and routable.

- **Dashboard** — Separate MFE; `baseUrl` is `http://localhost:5175`, route `/dashboard`. Run with `cd dashboard && npm run dev:remote`. It appears in the navbar only when the dashboard app is up.
- **OMS** — `baseUrl` is `http://localhost:5174`, route `/oms`. Run with `cd oms && npm run dev:remote`. It appears in the navbar only when the OMS app is up.

If an MFE dev server runs on a different port, update its `baseUrl` in `module.json`. For cross-origin health checks, MFEs may need to allow CORS from the Core origin.

To add more MFEs, add entries to `module.json` and register the icon name in `core/src/components/app-sidebar.tsx` (`ICON_MAP`).

## Module Federation (legacy)

Previously, Core loaded OMS and Dashboard as **remotes** via `@originjs/vite-plugin-federation`. When you clicked Dashboard or OMS in the sidebar, the corresponding remote app was loaded and rendered in the same page (no iframe); React was shared so only one instance ran.

- **Federation needed built remotes:** You had to run Core with `npm run dev` and Dashboard/OMS with `npm run dev:remote` so that `remoteEntry.js` existed. This path is now considered legacy.
- Remotes exposed `./App` (via `remoteEntry.tsx`); the host lazy‑loaded `oms/App` and `dashboard/App`. Core derived federation remote URLs from `core/public/module.json` (baseUrl + `/assets/remoteEntry.js`).

## Why we removed Module Federation

We moved away from Module Federation to a simpler **iframe‑based integration** for MFEs.

- **Dynamic modules from config:** MFEs are now discovered from a dynamic `module.json` / backend config. With Module Federation, we had to wire remotes at build time in Vite’s federation config, which doesn’t play well with modules that change at runtime.
- **Simpler onboarding of new MFEs:** With iframes, adding a new MFE is mostly about pointing to its URL in `module.json`. We don’t need to touch the host’s build config or expose new remote entries.
- **Better isolation:** Each MFE runs in its own iframe document, so CSS, JS, and runtime errors are isolated. This avoids style clashes and makes it safer for different teams to deploy independently.
- **Less coupling between apps:** MFEs can be deployed on different domains, versions, or even tech stacks. The host just needs a URL, which keeps deployments and rollbacks straightforward.

## Quick Start (legacy Module Federation setup)

Install deps once per app, then run core + remotes:

```bash
# 1) Core (host)
cd core
npm install
npm run dev

# 2) Dashboard (remote) - build + preview so remoteEntry exists
cd ../dashboard
npm install
npm run dev:remote

# 3) OMS (remote) - build + preview so remoteEntry exists
cd ../oms
npm install
npm run dev:remote
```
 
## API Servers (Fastify)

Each MFE has its own Fastify backend that proxies requests to the LoopBack 3 API at `https://bm-rhel-second-staging.wealthfy.com/api/`.

| Server | Port | Path | Purpose |
|--------|------|------|---------|
| **dashboard-api** | 4001 | `api/dashboard/` | Proxies ClientDashboard data |
| **oms-api** | 4002 | `api/oms/` | Instruments, orders, generic LoopBack proxy |

### Setup

```bash
# 1) Dashboard API
cd api/dashboard
npm install
cp .env.example .env
# Edit .env → paste your LoopBack token into LB_ACCESS_TOKEN
npm run dev

# 2) OMS API
cd ../oms
npm install
cp .env.example .env
# Edit .env → paste your LoopBack token into LB_ACCESS_TOKEN
npm run dev
```

Get your LoopBack token by logging into BM_WEALTH_MANAGEMENT and copying it from the session.

### Redis caching (dashboard-api & oms-api)

Both APIs support optional Redis caching for GET responses. See **[Redis Caching Implementation](./docs/REDIS_CACHING_README.md)** for requirements, configuration (`REDIS_URL`, `REDIS_TTL_SECONDS`, `REDIS_ENABLED`), and how to run Redis locally or via Docker.

### Generic Proxy

The OMS API includes a catch-all proxy at `/api/lb/*` that forwards any request to LoopBack 3:

```
GET  http://localhost:4002/api/lb/ClientDashboard/201/fetchDashboardData?fromDate=2025-01-01
POST http://localhost:4002/api/lb/Orders
```

## Tech Stack
 
- **React** — UI library
- **Vite** — Build tool & dev server
 
## Repository Structure
 
```
mfe_poc/
├── dashboard/       # Dashboard microfrontend
├── core/            # Core/shared microfrontend
├── oms/             # OMS microfrontend
└── README.md        # This file