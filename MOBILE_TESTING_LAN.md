# Mobile Testing over LAN for MFE POC

This document explains how to test the Microfrontend (MFE) architecture natively on a mobile device (like an iPhone) using your local Wi-Fi network (LAN), and why we bypassed Expo Go.

---

## 📱 Why we skipped Expo Go

You might have noticed an error stating the project is "incompatible with this version of Expo Go" when trying to scan the QR code.

- **The Issue:** The `webview-host` project was generated with the very latest Expo SDK (v55), but the regular Expo Go app downloaded from the App Store typically only supports slightly older, stable SDK versions.
- **The Solution:** Because the core application is ultimately just a web app, we don't actually need a React Native wrapper to test it on a phone! The mobile browser (Safari/Chrome) uses the exact same WebKit engine as a native WebView. Opening the web app directly in Safari provides the **exact same testing experience** with zero build or SDK compatibility issues.

---

## 🌐 How we made the MFE accessible over Wi-Fi

By default, development servers (like Vite and Fastify) only listen to `localhost`. This means they only accept connections coming from the exact same computer they are running on.
If you type `localhost:5173` on your iPhone, the iPhone looks for a server running *on the iPhone itself*.

To fix this, we made three critical sets of changes:

### 1. Exposing Vite Servers (`--host`)
We added the `--host` flag (or `host: true` in `vite.config.ts`) to the Core, Dashboard, and OMS applications. 
This tells Vite: *"Listen on `0.0.0.0` and allow connections from other devices on the same Wi-Fi network."*

### 2. Opening the Security Doors (CORS)
When the Core app (running on port `5173`) tries to fetch data from the Dashboard app (port `5175`) or the Dashboard API (port `4001`), the browser blocks it by default. This is called CORS (Cross-Origin Resource Sharing).
- We added `cors: true` to the Vite configs.
- We added your Mac's LAN IP (`http://192.168.0.142:5173`) to the CORS whitelist `corsOrigins` array in all the backend APIs (`core-api`, `dashboard-api`, `oms-api`).

### 3. Fixing Hardcoded API Connections (`window.location.hostname`)
Even when the apps loaded on the phone, the API calls inside the code were hardcoded to fetch from `http://localhost:4000`. So the phone was trying to find an API on the phone!
We changed the API base URLs to dynamically resolve using `window.location.hostname`. 
```typescript
// Example from core/src/hooks/useModules.ts
let baseUrl = (import.meta.env.VITE_CORE_API_BASE_URL ?? '').toString().trim();
if (typeof window !== 'undefined' && baseUrl.includes('localhost')) {
  baseUrl = baseUrl.replace('localhost', window.location.hostname);
}
```
This ensures that if you visit `192.168.0.142` in your browser, the app intelligently makes API requests to `192.168.0.142` instead of `localhost`.

---

## 🚀 How to Run the App on your Phone

1. **Connect to the same Wi-Fi:** Ensure your iPhone and Mac are on the exact same Wi-Fi network.
2. **Start all servers:** Make sure the following 6 terminals are running:
   - `core-api` (`npm run dev`)
   - `dashboard-api` (`npm run dev`)
   - `oms-api` (`npm run dev`)
   - `core` (`npm run dev`)
   - `dashboard` (`npm run dev:remote`)
   - `oms` (`npm run dev:remote`)
3. **Open Safari on your iPhone:** Navigate to your Mac's IP address and the Core port. For example: `http://192.168.0.142:5173`
4. **Make it feel like a Native App:**
   - Tap the **Share** button in Safari (the square with an arrow at the bottom).
   - Tap **"Add to Home Screen"**.
   - You now have an app icon on your home screen. When you tap it, the MFE app opens in full-screen mode without the Safari browser bars, feeling exactly like a native application!
