# Shadow DOM CSS Isolation for MFEs

## The Problem

Each MFE (Dashboard, OMS) uses Tailwind CSS classes like `bg-background`, `text-foreground`, `border-border`, etc.

**In a monorepo**, Core's `index.css` had `@source` pointing to MFE folders so it could scan their files and include their CSS classes:

```css
/* core/src/index.css — THIS WAS THE PROBLEM */
@source "../../dashboard/src";
@source "../../oms/src";
```

**In a polyrepo** (separate repos, separate CI/CD pipelines), Core's build cannot access MFE source files. So those `@source` lines break — Core's CSS would not include MFE classes, and everything would appear unstyled.

---

## The Solution: Shadow DOM

Each MFE now renders its UI inside its own **Shadow DOM** — a completely isolated part of the browser's DOM tree that has its own CSS scope.

Think of it like an `<iframe>`, but lighter and still fully connected to React.

```
Before (broken in polyrepo):
  Core's CSS ──── scans MFE source files ──── generates MFE classes
                         ↑
               NOT AVAILABLE in polyrepo

After (Shadow DOM):
  Core's CSS ──── only scans Core's own files ──── no @source needed
  MFE's CSS ──── lives inside the shadow root ──── completely self-contained
```

---

## How It Works (Step by Step)

### Step 1 — MFE builds its own CSS

Each MFE has a `mfe-federation.css` file that contains:
- Full Tailwind CSS (preflight reset + all utility classes)
- The same theme configuration as Core (so `bg-background`, `text-foreground`, etc. generate correctly)

```
dashboard/src/mfe-federation.css  ←  Dashboard's own Tailwind CSS
oms/src/mfe-federation.css        ←  OMS's own Tailwind CSS
```

### Step 2 — CSS is bundled as a string (not a file)

The CSS file is imported using Vite's `?inline` feature:

```ts
import mfeCss from './mfe-federation.css?inline'
//                                        ↑
//                     Vite processes Tailwind and returns
//                     the final CSS as a JavaScript string
```

This means the CSS travels **inside** the JS bundle, not as a separate `.css` file.

### Step 3 — A Shadow DOM root is created at runtime

When Core loads the MFE, a `ShadowWrapper` component:
1. Creates an invisible `<div>` in Core's DOM (the "host")
2. Attaches a **shadow root** to it (the isolated CSS zone)
3. Injects the MFE's CSS string into the shadow root
4. Renders the MFE's components inside the shadow root

```
Core's light DOM:
  <div>                    ← ShadowWrapper host div (visible in Core's DOM)
    #shadow-root           ← Shadow DOM boundary (CSS stops here)
      <div>                ← Portal target (inside shadow root)
        <App />            ← MFE content (styled by shadow root CSS only)
```

### Step 4 — React context still works (Router, etc.)

MFEs are rendered using `React.createPortal`. A portal changes **where** in the DOM something renders, but **not** its position in the React tree. So:

- OMS's `<Routes>` still has access to Core's `<BrowserRouter>` ✓
- State, context, event handlers all work normally ✓
- Only the CSS is isolated ✓

### Step 5 — Theme colours still work

CSS custom properties (variables like `--background`, `--foreground`) **automatically inherit through shadow DOM boundaries**. Core defines these in its `:root`:

```css
/* Core's index.css */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... */
}
```

The MFE's shadow root can read these inherited values, so `bg-background` inside the shadow root resolves to the correct colour defined by Core.

---

## Files Changed

### `core/src/index.css`
**Removed** the `@source` directives — Core no longer needs to scan MFE source files.

```css
/* REMOVED */
@source "../../dashboard/src";
@source "../../oms/src";
```

---

### `dashboard/src/mfe-federation.css` (updated)
Full Tailwind CSS + Core's theme mapping. This is the CSS that gets injected into Dashboard's shadow root.

```css
@import "tailwindcss";        /* preflight + all utilities */
@import "tw-animate-css";     /* animation utilities */
@import "shadcn/tailwind.css"; /* shadcn component styles */

/* Maps Core's CSS variables to Tailwind semantic classes */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-border: var(--border);
  /* ... all tokens */
}

@layer base {
  * { @apply border-border outline-ring/50; }
}
```

---

### `dashboard/src/ShadowWrapper.tsx` (new file)
The component that creates the shadow root and injects CSS.

```tsx
import { useRef, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import mfeCss from './mfe-federation.css?inline'   // CSS as a string

export function ShadowWrapper({ children }) {
  const hostRef = useRef(null)
  const [container, setContainer] = useState(null)

  useLayoutEffect(() => {
    const shadow = hostRef.current.attachShadow({ mode: 'open' })

    // Inject MFE CSS into shadow root (NOT into Core's <head>)
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(mfeCss)
    shadow.adoptedStyleSheets = [sheet]

    // Create a div inside shadow root as React's render target
    const div = document.createElement('div')
    shadow.appendChild(div)
    setContainer(div)
  }, [])

  return (
    <div ref={hostRef}>
      {container && createPortal(children, container)}
    </div>
  )
}
```

---

### `dashboard/src/remoteEntry.tsx` (updated)
Wraps the Dashboard app in the ShadowWrapper before exporting to Core.

```tsx
import { ShadowWrapper } from './ShadowWrapper'
import App from './App'

export default function DashboardRemote() {
  return (
    <ShadowWrapper>
      <App />
    </ShadowWrapper>
  )
}
```

---

### `oms/src/mfe-federation.css` (updated)
Identical to Dashboard's version — full Tailwind + Core's theme mapping.

---

### `oms/src/ShadowWrapper.tsx` (new file)
Identical to Dashboard's ShadowWrapper — same pattern, separate copy per MFE.

---

### `oms/src/remoteEntry.tsx` (updated)
Wraps OmsRoutes in ShadowWrapper. Note: `OmsRoutes` has no `BrowserRouter` — it relies on Core's router, which still flows through the React portal correctly.

```tsx
import { ShadowWrapper } from './ShadowWrapper'
import { OmsRoutes } from './App'

export default function OmsRemote() {
  return (
    <ShadowWrapper>
      <OmsRoutes />
    </ShadowWrapper>
  )
}
```

---

## Before vs After

| | Before | After |
|---|---|---|
| MFE CSS lives in | Core's `<head>` (via `@source` scan) | MFE's own shadow root |
| `@source` in Core | Required (monorepo only) | Not needed |
| Polyrepo support | Broken | Works |
| MFE CSS affects Core layout | Possible | Impossible (isolated) |
| Core CSS affects MFE layout | Yes | No (isolated) |
| Theme colours (`bg-background`) | From Core's scan | From inherited CSS variables |
| React Router in OMS | Works (shared context) | Works (portal preserves context) |
| Build output | Separate `.css` file per remote | CSS embedded in JS bundle |

---

## Known Limitation: Portals (Dialog, Tooltip, Popover)

shadcn/ui components like `Dialog`, `Tooltip`, and `Popover` render their content into `document.body` — **outside** the shadow root. This means they escape the shadow DOM's CSS isolation.

```
Shadow root (MFE CSS here)
  └── <Button onClick={openDialog} />  ← styled ✓

document.body (Core's CSS here)
  └── <Dialog />  ← rendered by shadcn portal, outside shadow root
```

**This is fine in practice** — Core's CSS uses the same Tailwind theme and the same CSS variables, so Dialog, Tooltip etc. will still be styled correctly by Core's stylesheet. There's no visual difference.

---

## How to Run

```bash
# Build and serve Dashboard remote (port 5175)
cd dashboard && npm run dev:remote

# Build and serve OMS remote (port 5174)
cd oms && npm run dev:remote

# Start Core host (port 5173)
cd core && npm run dev
```
