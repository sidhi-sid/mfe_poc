import { useQuery } from '@tanstack/react-query';

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

async function loadModules(): Promise<ModuleWithAvailability[]> {
  let baseUrl = (import.meta.env.VITE_CORE_API_BASE_URL ?? '').toString().trim();
  
  // Dynamically resolve localhost to actual hostname for LAN access (e.g. from phone)
  if (typeof window !== 'undefined' && baseUrl.includes('localhost')) {
    baseUrl = baseUrl.replace('localhost', window.location.hostname);
  }
  
  const configUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}${MODULE_CONFIG_ENDPOINT}` : '';

  if (!configUrl) {
    throw new Error('VITE_CORE_API_BASE_URL is not set. Set it to your core-api base URL (e.g. http://localhost:4000).');
  }

  const res = await fetch(configUrl);
  if (!res.ok) throw new Error(`Failed to load module config: ${res.status}`);
  const data = await res.json();
  const list: ModuleConfig[] = (data.modules ?? []).map((m: ModuleConfig) => {
    let mBase = m.baseUrl;
    if (typeof window !== 'undefined' && mBase && mBase.includes('localhost')) {
      mBase = mBase.replace('localhost', window.location.hostname);
    }
    return { ...m, baseUrl: mBase };
  });
  const withAvailability: ModuleWithAvailability[] = await Promise.all(
    list.map(async (m) => ({
      ...m,
      available: await checkModuleAvailable(m),
    }))
  );
  return withAvailability;
}

export function useModules() {
  const query = useQuery({
    queryKey: ['modules'],
    queryFn: loadModules,
  });

  const modules = (query.data ?? []) as ModuleWithAvailability[];
  const availableModules = modules.filter((m) => m.available);
  const error =
    query.error != null
      ? (query.error instanceof Error ? query.error : new Error('Unknown error'))
      : null;

  return {
    modules,
    availableModules,
    loading: query.isPending,
    error,
  };
}
