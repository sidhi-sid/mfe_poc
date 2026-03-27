# Onboarding & Auth Flow – Summary of Changes

This document lists all changes made to implement the getWMURL and authSelfOnboarding proxy flow, use the auth token for dashboard APIs, and fix LoopBack token format.

---

## 1. Dashboard API (Fastify) – New Onboarding Routes

### 1.1 Route: GET `/api/onboarding/getWMURL`

**File:** `mfe_poc/services/dashboard-api/routes/dashboard.js`

- Added: `fastify.get('/onboarding/getWMURL', dashboardController.getWMURL);`
- Purpose: Proxy to hosted LoopBack `Onboarding/getWMURL` to get the Wealth Management URL.

**File:** `mfe_poc/services/dashboard-api/controllers/dashboardController.js`

- Added `getWMURL(request, reply)`:
  - Proxies `GET` to `Onboarding/getWMURL`.
  - Forwards query params: `cifNumber`, `accountType`.
  - Returns hosted response (e.g. `{ url: "?uniqueId=...&bwayparam=...&param=..." }`).

---

### 1.2 Route: POST `/api/onboarding/authSelfOnboarding`

**File:** `mfe_poc/services/dashboard-api/routes/dashboard.js`

- Added: `fastify.post('/onboarding/authSelfOnboarding', dashboardController.authSelfOnboarding);`

**File:** `mfe_poc/services/dashboard-api/controllers/dashboardController.js`

- Added `authSelfOnboarding(request, reply)`:
  - Proxies `POST` to `Onboarding/authSelfOnboarding`.
  - Forwards request body as-is (e.g. `sessionId`, `bwayparam`, `param`, `device`, `token`).
  - Returns hosted response (e.g. `existing`, `active`, `token`, `cif`, `cbsResponse`, etc.).

---

## 2. Dashboard API – Auth Plugin (Onboarding Excluded)

**File:** `mfe_poc/services/dashboard-api/auth-plugin.js`

- Excluded onboarding routes from LB_TOKEN requirement so they can be called without a server-side token:
  - `/api/onboarding/getWMURL`
  - `/api/onboarding/authSelfOnboarding`
- Logic: if `pathname` is one of these, the hook returns early and does not require `config.lbToken` or set `request.lbToken`.

---

## 3. Dashboard API – Use Request Token When Present

**File:** `mfe_poc/services/dashboard-api/auth-plugin.js`

- Token source: use **request token first**, then config:
  - `const token = request.headers.authorization || config.lbToken;`
- 401 only when **both** are missing.
- Message updated to: *"Authorization required. Send Bearer token from authSelfOnboarding or set LB_TOKEN in .env."*
- Effect: Portfolio/bank (and other protected) routes can use the token sent by the client (from authSelfOnboarding) instead of only `LB_TOKEN`.

---

## 4. Dashboard API – LB Proxy: Optional Authorization & LoopBack Token Format

**File:** `mfe_poc/services/dashboard-api/lb-proxy.js`

- **Optional Authorization:** Only set `Authorization` header when `token` is truthy (avoids sending `Authorization: null` for unauthenticated calls like getWMURL).
- **LoopBack 3 token format:** LoopBack expects the **raw token** in the `Authorization` header, not `Bearer <token>`. Before forwarding to the hosted API, the proxy strips a leading `"Bearer "` (case-insensitive) from the token so the backend receives only the token string.

---

## 5. Dashboard Frontend – useWMURL Hook

**File:** `mfe_poc/dashboard/src/hooks/useWMURL.ts` (new)

- **getWMURL:** Calls `GET /api/onboarding/getWMURL?cifNumber=...&accountType=...`.
- **Parse URL:** Parses the response `url` (`?uniqueId=...&bwayparam=...&param=...`) into `{ sessionId, bwayparam, param }` (using `uniqueId` as `sessionId`).
- **authSelfOnboarding:** After getWMURL succeeds, calls `POST /api/onboarding/authSelfOnboarding` with body `{ sessionId, bwayparam, param, device: 'web' }`.
- **Return value:** `wmUrlResponse`, `wmUrl`, `authResponse`, `loading`, `error`.
- **Types:** `WMURLResponse`, `UseWMURLOptions`, `AuthSelfOnboardingResponse` (includes `token`, `existing`, `active`, `cif`, etc.).

---

## 6. Dashboard Frontend – Call Onboarding on Init & Pass Token to Dashboard APIs

**File:** `mfe_poc/dashboard/src/App.tsx`

- Calls `useWMURL({ cifNumber: '123456', accountType: 'Individual' })` on dashboard init.
- Reads `authResponse?.token` and passes it to `PortfolioCard` as `accessToken`.

**File:** `mfe_poc/dashboard/src/components/PortfolioCard.tsx`

- Added optional prop: `accessToken?: string | null`.
- Passes `accessToken` into `useDashboardData(201, accessToken)`.

**File:** `mfe_poc/dashboard/src/hooks/useDashboardData.ts`

- **Second parameter:** `useDashboardData(clientId, accessToken?)`.
- When `accessToken` is provided:
  - Sends `Authorization: Bearer <token>` (or the token as-is if it already starts with `Bearer `) on portfolio and bank `fetch` requests.
  - Only runs the fetch effect when `accessToken` is present (waits for auth before calling portfolio/bank).
- Dependency array updated to `[clientId, accessToken]`.

---

## 7. End-to-End Flow (After All Changes)

1. **Dashboard loads** → `useWMURL` runs in `App`.
2. **getWMURL** → Dashboard-api proxies to hosted `Onboarding/getWMURL` (no auth required).
3. **authSelfOnboarding** → Dashboard-api proxies to hosted `Onboarding/authSelfOnboarding` with parsed URL params (no auth required).
4. **Hosted API** returns `{ token, existing, active, cif, cbsResponse, ... }`.
5. **App** passes `authResponse.token` to `PortfolioCard` as `accessToken`.
6. **Portfolio/bank requests** → `useDashboardData` sends `Authorization: Bearer <token>` to dashboard-api.
7. **Dashboard-api** uses `request.headers.authorization` as `request.lbToken` and forwards to LoopBack.
8. **lb-proxy** strips `"Bearer "` and sends raw token in `Authorization` to LoopBack so portfolio/bank succeed instead of returning “Your previous session has expired!”.

---

## 8. Files Touched (Checklist)

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

## 9. How to Test

- **getWMURL:**  
  `GET http://localhost:4001/api/onboarding/getWMURL?cifNumber=123456&accountType=Individual`  
  (no `Authorization` header required.)

- **authSelfOnboarding:**  
  `POST http://localhost:4001/api/onboarding/authSelfOnboarding`  
  Body: `{ "sessionId": "<uniqueId from getWMURL>", "bwayparam": "...", "param": "...", "device": "web" }`  
  (no `Authorization` header required.)

- **Portfolio/Bank (with token):**  
  `GET http://localhost:4001/api/dashboard/201/portfolio?fromDate=2025-01-01&currencyId=247`  
  Header: `Authorization: Bearer <token from authSelfOnboarding>`  
  (or raw token; proxy will strip `Bearer ` when sending to LoopBack.)

- **Full flow:** Load the dashboard app; it should call getWMURL → authSelfOnboarding, then load portfolio and bank using the returned token without 401.
