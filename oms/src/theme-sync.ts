import { applyTheme, type Theme } from './lib/theme';

export function setupThemeSync() {
  if (typeof window === 'undefined') return;

  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as { type?: string; theme?: Theme } | null;
    if (!data || data.type !== 'theme-change') return;

    const theme = data.theme;
    if (theme === 'light' || theme === 'dark') {
      applyTheme(theme);
    }
  });
}

