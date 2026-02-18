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

- **Dashboard** — Separate MFE; `baseUrl` is `http://localhost:5175`, route `/dashboard`. Run with `cd dashboard && npm run dev`. It appears in the navbar only when the dashboard app is up.
- **OMS** — `baseUrl` is `http://localhost:5174`, route `/oms`. Run with `cd oms && npm run dev`. It appears in the navbar only when the OMS app is up.

If an MFE dev server runs on a different port, update its `baseUrl` in `module.json`. For cross-origin health checks, MFEs may need to allow CORS from the Core origin.

To add more MFEs, add entries to `module.json` and register the icon name in `core/src/components/app-sidebar.tsx` (`ICON_MAP`).

## Quick Start

Each project is an independent React + Vite application. To run any project:

```bash
cd <project-name>   # dashboard, core, or oms
npm install
npm run dev
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