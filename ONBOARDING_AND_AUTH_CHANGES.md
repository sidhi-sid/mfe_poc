# Onboarding & Auth Flow – Summary of Changes

This document lists all code changes made to implement the getWMURL → authSelfOnboarding flow and to use the resulting token for dashboard API calls (portfolio, bank).

---

## 1. Dashboard API (Fastify) – New Onboarding Endpoints

### 1.1 Routes (`services/dashboard-api/routes/dashboard.js`)

- **GET `/api/onboarding/getWMURL`**  
  - Proxies to hosted LoopBack `Onboarding/getWMURL`.  
  - Query: `cifNumber`, `accountType` (Individual | Joint | Corporate).

- **POST `/api/onboarding/authSelfOnboarding`**  
  - Proxies to hosted LoopBack `Onboarding/authSelfOnboarding`.  
  - Body: `{ sessionId, bwayparam, param, device?, token? }`.

### 1.2 Controller (`services/dashboard-api/controllers/dashboardController.js`)

- **`getWMURL(request, reply)`**  
  - Proxies GET to `Onboarding/getWMURL` with `query: { cifNumber, accountType }` from request query.  
  - Returns `reply.code(result.status).send(result.data)`.

- **`authSelfOnboarding(request, reply)`**  
  - Proxies POST to `Onboarding/authSelfOnboarding` with `body: request.body || {}`.  
  - Returns `reply.code(result.status).send(result.data)`.

---

## 2. Dashboard API – Auth and Proxy Behavior

### 2.1 Auth plugin (`services/dashboard-api/auth-plugin.js`)

- **Paths excluded from token check**  
  - `/api/onboarding/getWMURL` and `/api/onboarding/authSelfOnboarding` do not require a token (no LB_TOKEN needed to call them).

- **Token source**  
  - `request.lbToken` is set from **request first**, then config:  
    `token = request.headers.authorization || config.lbToken`  
  - So when the frontend sends `Authorization: Bearer <token>` (from authSelfOnboarding), that token is used for subsequent proxied calls (e.g. portfolio, bank).  
  - 401 is returned only when **both** the `Authorization` header and `LB_TOKEN` in config are missing.

### 2.2 LoopBack proxy (`services/dashboard-api/lb-proxy.js`)

- **Authorization header**  
  - Set only when `token` is truthy (no `Authorization: null` for unauthenticated routes).

- **LoopBack 3 token format**  
  - LoopBack 3 expects the **raw token** in the `Authorization` header, not `Bearer <token>`.  
  - Before forwarding to LoopBack, the proxy strips a leading `Bearer ` (case-insensitive) from the token.  
  - Example: client sends `Authorization: Bearer abc123` → proxy sends `Authorization: abc123` to the hosted API.

---

## 3. Dashboard Frontend – Onboarding and Token Usage

### 3.1 Hook: `useWMURL` (`dashboard/src/hooks/useWMURL.ts`)

- **Purpose**  
  - On dashboard init: call getWMURL, then call authSelfOnboarding with the parsed URL params.

- **Flow**  
  1. GET `/api/onboarding/getWMURL?cifNumber=...&accountType=...`  
  2. Parse response `url` (`?uniqueId=...&bwayparam=...&param=...`) into `{ sessionId, bwayparam, param }` (uniqueId → sessionId).  
  3. POST `/api/onboarding/authSelfOnboarding` with body `{ sessionId, bwayparam, param, device: 'web' }`.  
  4. Store both `wmUrlResponse` and `authResponse` in state.

- **Exports**  
  - `useWMURL(options?)` with `cifNumber`, `accountType` (defaults: `'201'`, `'Individual'`).  
  - Return: `{ wmUrlResponse, wmUrl, authResponse, loading, error }`.  
  - Types: `WMURLResponse`, `UseWMURLOptions`, `AuthSelfOnboardingResponse` (includes `token`).

- **Helper**  
  - `parseWMUrlToAuthParams(url)` – parses getWMURL `url` into authSelfOnboarding body params.

### 3.2 Hook: `useDashboardData` (`dashboard/src/hooks/useDashboardData.ts`)

- **New parameter**  
  - `useDashboardData(clientId = 201, accessToken?: string | null)`  
  - When `accessToken` is provided, all portfolio and bank `fetch` calls include:  
    `Authorization: accessToken.startsWith('Bearer ') ? accessToken : \`Bearer ${accessToken}\``

- **Behavior**  
  - Effect runs only when `accessToken` is truthy (no portfolio/bank request until token is available).  
  - Dependency array includes `accessToken` so when token is set after authSelfOnboarding, requests are sent with it.

### 3.3 App (`dashboard/src/App.tsx`)

- Calls `useWMURL({ cifNumber: '123456', accountType: 'Individual' })` on init.
- Reads `accessToken = authResponse?.token ?? null` and passes it to `PortfolioCard`:  
  `<PortfolioCard accessToken={accessToken} />`.

### 3.4 PortfolioCard (`dashboard/src/components/PortfolioCard.tsx`)

- **New prop**  
  - `accessToken?: string | null` (optional).

- **Usage**  
  - Passes `accessToken` into `useDashboardData(201, accessToken)` so portfolio and bank requests use the authSelfOnboarding token.

---

## 4. End-to-end flow

1. Dashboard loads → `App` runs `useWMURL` → getWMURL → authSelfOnboarding → `authResponse` (with `token`) is set.  
2. `App` passes `authResponse.token` to `PortfolioCard` as `accessToken`.  
3. `useDashboardData(201, accessToken)` runs when `accessToken` is set and sends portfolio and bank requests with `Authorization: Bearer <token>`.  
4. Dashboard-api auth plugin uses `request.headers.authorization` as `request.lbToken`.  
5. lb-proxy strips `Bearer ` and forwards the raw token to LoopBack so portfolio/bank use the same session and no longer return “Your previous session has expired!”.

---

## 5. Files touched

| Area              | File(s) |
|-------------------|--------|
| Dashboard API     | `services/dashboard-api/routes/dashboard.js` |
|                   | `services/dashboard-api/controllers/dashboardController.js` |
|                   | `services/dashboard-api/auth-plugin.js` |
|                   | `services/dashboard-api/lb-proxy.js` |
| Dashboard frontend| `dashboard/src/hooks/useWMURL.ts` (new) |
|                   | `dashboard/src/hooks/useDashboardData.ts` |
|                   | `dashboard/src/App.tsx` |
|                   | `dashboard/src/components/PortfolioCard.tsx` |

---

## 6. How to test

1. **getWMURL (no auth)**  
   ```bash
   curl "http://localhost:4001/api/onboarding/getWMURL?cifNumber=123456&accountType=Individual"
   ```  
   Expect: `{ "url": "?uniqueId=...&bwayparam=...&param=..." }`.

2. **authSelfOnboarding (no auth)**  
   ```bash
   curl -X POST http://localhost:4001/api/onboarding/authSelfOnboarding \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"<uniqueId>","bwayparam":"...","param":"...","device":"web"}'
   ```  
   Expect: JSON with `token`, `existing`, `active`, `cif`, etc.

3. **Portfolio/Bank with token**  
   Use the dashboard app: it will call getWMURL → authSelfOnboarding, then use the returned token for portfolio and bank.  
   Or manually:  
   ```bash
   curl -H "Authorization: Bearer <token_from_authSelfOnboarding>" \
     "http://localhost:4001/api/dashboard/201/portfolio?fromDate=2025-01-01&currencyId=247"
   ```  
   Expect: 200 and portfolio data (no “session expired” 401).
