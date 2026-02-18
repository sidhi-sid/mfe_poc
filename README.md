# MFE POC — Microfrontend Proof of Concept
 
A monorepo containing three independent React + Vite microfrontend applications.
 
## Projects
 
| Project | Description | Path |
|---------|-------------|------|
| **Dashboard** | Dashboard microfrontend | [`dashboard/`](./dashboard) |
| **Core** | Core/shared microfrontend module | [`core/`](./core) |
| **OMS** | Order Management System microfrontend | [`oms/`](./oms) |
 
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