import { useEffect, useState } from 'react';

export interface ModuleConfig {
  id: string;
  path: string;
  label: string;
  icon: string;
  baseUrl: string;
}

export interface ModuleWithAvailability extends ModuleConfig {
  available: boolean;
}

const HEALTH_CHECK_TIMEOUT_MS = 3000;

/** Endpoint on core-api that returns module config (same shape as module.json). */
const MODULE_CONFIG_ENDPOINT = '/api/modules';

async function checkModuleAvailable(moduleConfig: ModuleConfig): Promise<boolean> {
  const { baseUrl } = moduleConfig;
  if (!baseUrl || baseUrl === '' || baseUrl === window.location.origin) {
    return true;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
    const res = await fetch(baseUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
      const res = await fetch(baseUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }
}

export function useModules() {
  const [modules, setModules] = useState<ModuleWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const baseUrl = (import.meta.env.VITE_CORE_API_BASE_URL ?? '').toString().trim();
    const configUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}${MODULE_CONFIG_ENDPOINT}` : '';
    async function load() {
      try {
        if (!configUrl) {
          if (!cancelled) {
            setModules([]);
            setError(new Error('VITE_CORE_API_BASE_URL is not set. Set it to your core-api base URL (e.g. http://localhost:4000).'));
          }
        } else {
        const res = await fetch(configUrl);
        if (!res.ok) throw new Error(`Failed to load module config: ${res.status}`);
        const data = await res.json();
        const list: ModuleConfig[] = data.modules ?? [];
        const withAvailability: ModuleWithAvailability[] = await Promise.all(
          list.map(async (m) => ({
            ...m,
            available: await checkModuleAvailable(m),
          }))
        );
        if (!cancelled) {
          setModules(withAvailability);
        }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Unknown error'));
          setModules([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableModules = modules.filter((m) => m.available);

  return { modules, availableModules, loading, error };
}
