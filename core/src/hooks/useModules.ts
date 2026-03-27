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

async function loadModules(accessToken: string): Promise<ModuleWithAvailability[]> {
  const baseUrl = (import.meta.env.VITE_CORE_API_BASE_URL ?? '').toString().trim();
  const configUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}${MODULE_CONFIG_ENDPOINT}` : '';

  if (!configUrl) {
    throw new Error('VITE_CORE_API_BASE_URL is not set. Set it to your core-api base URL (e.g. http://localhost:4000).');
  }

  const headers: HeadersInit = {};
  if (accessToken) {
    headers['Authorization'] = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`;
  }

  const res = await fetch(configUrl, { headers });
  if (!res.ok) throw new Error(`Failed to load module config: ${res.status}`);
  const data = await res.json();
  const list: ModuleConfig[] = data.modules ?? [];
  const withAvailability: ModuleWithAvailability[] = await Promise.all(
    list.map(async (m) => ({
      ...m,
      available: await checkModuleAvailable(m),
    }))
  );
  return withAvailability;
}

export function useModules(accessToken: string | null | undefined) {
  const enabled = !!accessToken;
  const query = useQuery({
    queryKey: ['modules', accessToken],
    queryFn: () => loadModules(accessToken!),
    enabled,
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
