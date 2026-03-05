import { applyTheme, type Theme } from './lib/theme';

/**
 * Bridge that receives **all** `core:*` postMessages from the Core host and
 * re-dispatches them as local CustomEvents on this MFE's own `window`.
 *
 * This means every existing `window.addEventListener('theme-change', ...)`
 * or `window.addEventListener('app:language-change', ...)` keeps working
 * unchanged — regardless of whether this MFE runs standalone, via Module
 * Federation, or inside an iframe.
 *
 * Namespacing: Core sends  `{ type: 'core:<eventName>', payload: {...} }`.
 * We strip the `core:` prefix and dispatch `CustomEvent(<eventName>, { detail: payload })`.
 */
export function setupHostSync() {
  if (typeof window === 'undefined') return;

  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as Record<string, unknown> | null;
    if (!data || typeof data !== 'object') return;

    const type = data.type;
    if (typeof type !== 'string' || !type.startsWith('core:')) return;

    const localEventName = type.slice(5); // strip 'core:' prefix
    const payload = data.payload;

    // Re-dispatch as a local CustomEvent so existing listeners work
    window.dispatchEvent(
      new CustomEvent(localEventName, { detail: payload }),
    );

    // Theme needs a direct call because MFEs apply it imperatively
    if (localEventName === 'theme-change') {
      const theme = (payload as { theme?: Theme })?.theme;
      if (theme === 'light' || theme === 'dark') {
        applyTheme(theme);
      }
    }

    // Language needs <html dir/lang> attributes for RTL layout
    if (localEventName === 'app:language-change') {
      const detail = payload as { language?: string; dir?: string } | undefined;
      if (detail?.language) {
        const dir = detail.dir ?? (detail.language === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', detail.language);
        document.documentElement.setAttribute('dir', dir);
      }
    }
  });
}
