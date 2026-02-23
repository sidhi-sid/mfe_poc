# RTL / i18n Implementation — MFE Architecture

## Overview

Language switching (English ↔ Arabic) with full RTL layout support across all
three Micro-Frontends (Core, Dashboard, OMS) — **zero cross-MFE dependency**.

---

## How It Works (in 4 steps)

```
1. User clicks "عربي" button in Core sidebar
        │
        ▼
2. Core calls applyLanguage('ar')
   ├── document.documentElement.setAttribute('dir', 'rtl')   ← CSS contract
   ├── document.documentElement.setAttribute('lang', 'ar')
   ├── localStorage.setItem('bm-language', 'ar')             ← persist across reload
   └── window.dispatchEvent(new CustomEvent('app:language-change', { detail: { language: 'ar' } }))
        │
        │   (shared browser window — no import, no package, no coupling)
        │
        ▼
3. Each MFE independently listens to the window event
   ├── Core's i18n.ts        → i18n.changeLanguage('ar')  → sidebar text flips
   ├── Dashboard's hook      → setLang('ar')              → portfolio text flips
   └── OMS's hook            → setLang('ar')              → order form text flips
        │
        ▼
4. CSS handles ALL layout direction automatically
   └── Tailwind logical properties (ps-, pe-, ms-, me-, start-, end-, text-end)
       read <html dir="rtl"> and flip every layout — no extra code in any MFE
```

---

## Architecture: Zero Dependency Between MFEs

| Concern | Mechanism | Code needed in each MFE |
|---------|-----------|--------------------------|
| Layout direction (RTL/LTR) | `<html dir="rtl">` CSS contract | **None** — CSS handles it |
| Language state | `window` custom event | 1 `addEventListener` in a hook |
| Translated text | Local JSON files bundled per MFE | Own JSON files only |
| Persistence on reload | `localStorage` + inline `<script>` in Core's index.html | None in MFEs |

No MFE imports anything from another MFE. If Dashboard or OMS are deployed
to a completely different server, everything still works.

---

## Files Changed

### CORE (`core/`)

#### `src/lib/language.ts`
Central language utility — the single source of truth for language switching.
- Sets `<html dir>` and `<html lang>`
- Saves to `localStorage`
- Fires `window` custom event

#### `src/store/index.ts`
Added `useLanguageStore` (Zustand):
- `language`, `isRTL`, `setLanguage`
- Calls `applyLanguage()` which triggers the CSS + window event chain

#### `src/i18n.ts` *(new file)*
Core's **private** i18n instance using `createInstance()` from i18next.
- Completely isolated — no other MFE can access or overwrite it
- Listens to `app:language-change` to keep in sync
- `initImmediate: false` ensures translations are ready on first render

```ts
const i18n = createInstance()           // ← private, never shared
i18n.use(initReactI18next).init({ ... })
```

#### `src/locales/en.json` + `src/locales/ar.json` *(new files)*
Core's own translations: sidebar greeting, toggle button, logout.

#### `src/App.tsx`
Wrapped with `<I18nextProvider i18n={coreI18n}>` so Core's components
always use Core's private i18n instance — immune to any remote MFE's code.

#### `src/components/app-sidebar.tsx`
- Added `useLanguageStore` + `useTranslation` for translated sidebar text
- Added language toggle button (Globe icon)
- `side={isRTL ? 'right' : 'left'}` — physically moves sidebar to right in Arabic

#### `src/components/header.tsx`
- Changed physical CSS classes to Tailwind logical properties (`mr-2` → `me-2`, etc.)
- Added `useTranslation` for dropdown labels

#### `src/index.css`
Added Arabic system font for RTL mode (no CDN, no download):
```css
[dir="rtl"] {
  font-family: "Segoe UI", Tahoma, "Arabic Typesetting", system-ui, sans-serif;
}
```

#### `index.html`
- Added `dir="ltr"` on `<html>` tag
- Added inline `<script>` that restores language from `localStorage` **before React mounts**
  (prevents layout flash on hard reload)

#### `vite.config.ts`
Shared modules: `react`, `react-dom`, `react-router-dom` only.
No i18next or react-i18next in shared — each MFE is fully self-contained.

---

### DASHBOARD (`dashboard/`)

#### `src/useAppTranslation.ts` *(new file)*
Tiny custom translation hook — **no i18n library**.

```ts
export function useAppTranslation() {
  const [lang, setLang] = useState(() =>
    document.documentElement.getAttribute('lang') ?? 'en'
  )
  useEffect(() => {
    const handler = (e) => setLang(e.detail.language)
    window.addEventListener('app:language-change', handler)
    return () => window.removeEventListener('app:language-change', handler)
  }, [])

  // t('portfolio.totalValue') → "Total Value" / "إجمالي القيمة"
  // t('search.found', { count: 5 }) → "5 instruments found" (plural-aware)
  return { t }
}
```

#### `src/locales/en.json` + `src/locales/ar.json` *(new files)*
Dashboard's own translations: title, subtitle, all portfolio card labels.

#### `src/App.tsx`
- Removed `I18nextProvider` and react-i18next
- Uses `useAppTranslation()` directly

#### `src/components/PortfolioCard.tsx`
- Replaced `import { useTranslation } from 'react-i18next'` with `useAppTranslation`
- `text-right` → `text-end` (logical property for RTL)

#### `src/remoteEntry.tsx`
Removed `import './i18n'` — no i18n library initialisation needed.

#### `vite.config.ts`
Shared: `react`, `react-dom` only. No i18next or react-i18next.

---

### OMS (`oms/`)

#### `src/useAppTranslation.ts` *(new file)*
Identical pattern to Dashboard's hook — listens to `app:language-change`,
returns `t()` backed by OMS's own JSON files.

#### `src/locales/en.json` + `src/locales/ar.json` *(new files)*
OMS's own translations: instrument search page + full order form.
Includes plural support: `found_one` / `found_other`.

#### `src/pages/InstrumentList.jsx`
- Replaced `useTranslation` (react-i18next) with `useAppTranslation`
- Physical CSS → logical: `left-3`→`start-3`, `right-2`→`end-2`, `pl-9`→`ps-9`
- `rtl:rotate-180` on ArrowRight icon (flips direction in Arabic)

#### `src/pages/CreateOrder.jsx`
- Replaced `useTranslation` with `useAppTranslation`
- Physical CSS → logical: `-ml-2`→`-ms-2`, `mr-1`→`me-1`, `pl-6`→`ps-6`
- `rtl:rotate-180` on ArrowLeft icon

#### `src/App.tsx`
Removed `I18nextProvider` and omsI18n import — clean, no library.

#### `src/remoteEntry.tsx`
Removed `import './i18n'`.

#### `vite.config.ts`
Shared: `react`, `react-dom`, `react-router-dom` only.

---

## Production Readiness

### ✅ Ready
| Item | Status |
|------|--------|
| No CDN / network dependency for translations | ✅ All JSON files bundled at build time |
| Persists language on hard reload | ✅ localStorage + inline script in index.html |
| No layout flash on reload | ✅ Inline script runs before React mounts |
| Works if MFEs deployed on separate servers | ✅ Only `window` is shared |
| No library version conflicts between MFEs | ✅ No shared i18next / react-i18next |
| RTL layout on all Tailwind components | ✅ Logical CSS properties throughout |
| Sidebar physically moves to right in Arabic | ✅ `side={isRTL ? 'right' : 'left'}` |
| Arabic font (no CDN) | ✅ System font stack in CSS |

### ⚠️ Things to do before go-live
| Item | Action |
|------|--------|
| Add missing Arabic translations | Fill out `ar.json` in each MFE fully |
| `npm run build` for remotes after every code change | Dashboard and OMS must be **rebuilt and redeployed** — they are static bundles |
| Core can hot-reload in dev | Core runs `npm run dev`; remotes run `npm run build && npm run preview` |
| Add `<html dir lang>` to Dashboard and OMS `index.html` | Needed only if remotes are ever opened standalone (not inside Core) |

---

## Deployment Order

```
1. npm run build   (in /dashboard)
2. npm run build   (in /oms)
3. Serve /dashboard/dist and /oms/dist on their respective ports/CDN
4. npm run dev     (in /core)  ← picks up remote URLs from public/module.json
```

No coordination needed between teams after initial setup.
Each MFE team owns their `locales/` folder independently.
