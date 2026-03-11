import { useQuery } from '@tanstack/react-query'
import {
  getWMURL,
  authSelfOnboarding,
  parseWMUrlToAuthParams,
  type AuthSelfOnboardingResponse,
  type WMURLResponse,
} from '@/api/client'

export type { WMURLResponse, AuthSelfOnboardingResponse }

export interface UseWMURLOptions {
  cifNumber?: string
  accountType?: 'Individual' | 'Joint' | 'Corporate'
}

/**
 * Fetches the Wealth Management URL (getWMURL), then runs authSelfOnboarding as a dependent query.
 * Second request runs only after the first succeeds and provides parseable params.
 */
export function useWMURL(options: UseWMURLOptions = {}) {
  const { cifNumber = '201', accountType = 'Individual' } = options

  const wmQuery = useQuery({
    queryKey: ['wmUrl', cifNumber, accountType],
    queryFn: () => getWMURL(cifNumber, accountType),
  })

  const wmUrl = wmQuery.data?.url ?? null
  const authParams = wmUrl ? parseWMUrlToAuthParams(wmUrl) : null

  const authQuery = useQuery({
    queryKey: ['authSelfOnboarding', cifNumber, accountType, authParams?.sessionId],
    queryFn: () => authSelfOnboarding(authParams!),
    enabled: !!wmQuery.data && !!authParams,
  })

  const loading = wmQuery.isPending || authQuery.isPending
  const error =
    wmQuery.error != null
      ? (wmQuery.error instanceof Error ? wmQuery.error.message : 'Failed to fetch WM URL')
      : authQuery.error != null
        ? (authQuery.error instanceof Error ? authQuery.error.message : 'Failed to auth')
        : wmQuery.data != null && authParams === null
          ? 'Could not parse WM URL for authSelfOnboarding'
          : null

  return {
    wmUrlResponse: wmQuery.data ?? null,
    wmUrl: wmUrl ?? null,
    authResponse: (authQuery.data as AuthSelfOnboardingResponse | undefined) ?? null,
    loading,
    error: error ?? null,
  }
}
