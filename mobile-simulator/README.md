# Mobile Simulator — Implementation Explained

A React Native (Expo) app that simulates a mobile device WebView, built to test how the MFE-based Wealth App behaves when embedded inside a real mobile banking application.

---

## The Problem It Solves

In the real product, the Wealth App (built as Micro Frontends) will be embedded inside a **native mobile banking app** via a WebView. During development, we needed a way to simulate that environment locally — to see exactly how the web app looks and behaves inside a mobile WebView — without building a full native app.

---

## Overall Project Structure

The project is a **Micro Frontend (MFE) architecture** with the following parts:

```
mfe_poc/
│
├── iframe-host/          Vanilla JS — Bank of Muscat landing page, entry point
│
├── core/                 React — Shell app, auth flow, module loader
├── dashboard/            React — Dashboard MFE
├── oms/                  React — Order Management MFE
│
├── services/
│   ├── core-api/         Node.js (Fastify) — Serves module config
│   ├── dashboard-api/    Node.js (Fastify) — Auth, onboarding, proxy to backend
│   └── oms-api/          Node.js (Fastify) — OMS data, proxy to backend
│
└── mobile-simulator/     React Native (Expo) — This app
```

---

## Port Map

| Service | Port | Role |
|---|---|---|
| core-api | 4000 | Serves MFE module config |
| dashboard-api | 4001 | Auth, onboarding, Redis-cached data |
| oms-api | 4002 | OMS instruments and proxy |
| core | 5173 | Shell app (requires auth params) |
| oms | 5174 | OMS MFE |
| dashboard | 5175 | Dashboard MFE |
| iframe-host | 5180 | Entry point — Bank of Muscat landing page |
| mobile-simulator | 8081 | This simulator (Expo web) |

---

## Folder Structure of the Simulator

```
mobile-simulator/
├── App.tsx        All UI and logic lives here — single file
├── index.ts       Expo entry point (registers App component)
├── app.json       Expo config (app name, splash, icons)
├── package.json
├── tsconfig.json
└── assets/        App icons and splash screen
```

The entire simulator is a **single-file React Native component** (`App.tsx`). No routing, no separate screens, no state management library — intentionally minimal.

---

## How the Simulator Was Built

### Step 1 — Scaffold with Expo

```bash
npx create-expo-app mobile-simulator --template blank-typescript
```

Expo was chosen over plain React Native because it works across iOS, Android, and web browser from a single codebase with zero native configuration.

### Step 2 — Install WebView

```bash
npx expo install react-native-webview
```

`react-native-webview` renders a real native WebView on iOS (`WKWebView`) and Android (`WebView`). This is the same component real banking apps use to embed web content.

### Step 3 — Add web browser fallback

```bash
npx expo install react-dom react-native-web @expo/metro-runtime
```

`react-native-webview` does not support the web browser platform. So a `Platform.OS` check was added to render a native HTML `<iframe>` when running in a browser instead:

```tsx
{Platform.OS === 'web' ? (
  <iframe src={activeUrl} style={{ width: '100%', height: '100%', border: 'none' }} />
) : (
  <WebView source={{ uri: activeUrl }} ... />
)}
```

This means the same code works as a browser preview (`npx expo start --web`) and as a real mobile app (iOS/Android).

---

## App.tsx — Component Breakdown

### State

```tsx
const [activeUrl, setActiveUrl]       = useState('http://localhost:5180')  // loaded URL
const [inputUrl, setInputUrl]         = useState('http://localhost:5180')  // address bar
const [loading, setLoading]           = useState(false)                    // loading spinner
const [canGoBack, setCanGoBack]       = useState(false)
const [canGoForward, setCanGoForward] = useState(false)
const webviewRef = useRef<WebView>()                                        // WebView control
```

### Three UI sections

**1. Top control bar**
- Title
- Quick-switch chip buttons for each MFE URL
- Manual address bar + Go button

**2. Phone frame** — the core of the simulator
- A `View` styled with `borderRadius: 36`, a top notch, and a bottom home bar to look like a real device
- Fixed dimensions: `320 × 568` (portrait phone)
- Inside: `WebView` (native) or `<iframe>` (web browser)
- A loading overlay with `ActivityIndicator` sits on top while the page loads

**3. Navigation bar**
- Back, Reload, Forward buttons
- Back/Forward call `webviewRef.current?.goBack()` / `goForward()`
- `onNavigationStateChange` on the WebView keeps `canGoBack` / `canGoForward` in sync as the user navigates inside the WebView

---

## The Auth Flow Inside the Simulator

The simulator opens the **Iframe Host** (`localhost:5180`) — not the Core App directly. This is because the Core App requires authentication parameters in the URL to function.

```
Mobile Simulator (localhost:8081)
    └── WebView
            └── Iframe Host (localhost:5180)
                    │
                    ├── Shows Bank of Muscat landing page
                    │
                    └── On "Wealth App" click:
                            ├── GET /api/onboarding/getWMURL (dashboard-api :4001)
                            │       → returns { url: "?uniqueId=...&bwayparam=...&param=..." }
                            │
                            └── Loads Core App in iframe:
                                    http://localhost:5173?wmUrl=...&cifNumber=999777
                                            │
                                            ├── POST /api/onboarding/authSelfOnboarding
                                            │       → returns { token, cif }
                                            │
                                            ├── GET /api/modules (core-api :4000)
                                            │       → returns list of MFE modules + their URLs
                                            │
                                            └── Renders each MFE in an iframe
                                                    ├── Dashboard (:5175)
                                                    └── OMS (:5174)
```

Opening `localhost:5173` directly skips the `getWMURL` step, so no auth token is generated and the app stays stuck on a loading spinner forever.

---

## Running It

### Start all services (one command from project root)

```bash
npx concurrently \
  "cd services/core-api && npm run dev" \
  "cd services/dashboard-api && npm run dev" \
  "cd services/oms-api && npm run dev" \
  "cd core && npm run dev" \
  "cd dashboard && npm run dev" \
  "cd oms && npm run dev" \
  "cd iframe-host && npm run dev"
```

### Start the simulator

```bash
cd mobile-simulator

npx expo start --web          # browser (quickest, uses iframe)
npx expo start                # press i → iOS Simulator (requires Xcode)
                              # press a → Android Emulator (requires Android Studio)
```

### Physical device (no simulator needed)
1. Install **Expo Go** from the App Store / Play Store
2. Run `npx expo start`
3. Scan the QR code
4. Replace `localhost` with your machine's LAN IP in `App.tsx` preset URLs

---

## Key Technical Decisions

| Decision | Reason |
|---|---|
| Expo over plain React Native | No native build tools needed, runs on web too |
| Single `App.tsx` file | Simulator is a dev tool, not a product — kept minimal |
| Default to Iframe Host (`:5180`) | Core App needs auth params; iframe-host generates them |
| `Platform.OS` check for iframe vs WebView | `react-native-webview` has no web browser support |
| Fixed 320×568 phone dimensions | Simulates a standard mobile viewport for accurate testing |
