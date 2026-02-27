import { useState, useEffect } from 'react'

const DASHBOARD_API_BASE = 'http://localhost:4001'

export interface WMURLResponse {
  url: string
}

export interface UseWMURLOptions {
  cifNumber?: string
  accountType?: 'Individual' | 'Joint' | 'Corporate'
}

/** Response from authSelfOnboarding; use token for subsequent API calls (portfolio, bank). */
export interface AuthSelfOnboardingResponse {
  token?: string
  existing?: boolean
  active?: boolean
  cif?: string
  finacleUserId?: string
  selfOnboarding?: boolean
  cbsResponse?: unknown
  decryptedInfo?: unknown
  case?: number
  [key: string]: unknown
}

/**
 * Parses the getWMURL response url (?uniqueId=...&bwayparam=...&param=...) into authSelfOnboarding body params.
 */
function parseWMUrlToAuthParams(url: string): { sessionId: string; bwayparam: string; param: string } | null {
  if (!url || !url.startsWith('?')) return null
  const params = new URLSearchParams(url)
  const sessionId = params.get('uniqueId')
  const bwayparam = params.get('bwayparam')
  const param = params.get('param')
  if (!sessionId || !bwayparam || !param) return null
  return { sessionId, bwayparam, param }
}

/**
 * Fetches the Wealth Management URL from getWMURL, then calls authSelfOnboarding with those params.
 */
export function useWMURL(options: UseWMURLOptions = {}) {
  const { cifNumber = '201', accountType = 'Individual' } = options
  const [wmUrlResponse, setWmUrlResponse] = useState<WMURLResponse | null>(null)
  const [authResponse, setAuthResponse] = useState<AuthSelfOnboardingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchWMURLThenAuth() {
      try {
        const params = new URLSearchParams({ cifNumber, accountType })
        const wmRes = await fetch(
          `${DASHBOARD_API_BASE}/api/onboarding/getWMURL?${params}`,
        )
        if (!wmRes.ok) {
          throw new Error(`getWMURL returned ${wmRes.status}`)
        }
        const wmData = await wmRes.json()
        if (cancelled) return

        setWmUrlResponse(wmData)

        const authParams = parseWMUrlToAuthParams(wmData?.url ?? '')
        if (!authParams) {
          setError('Could not parse WM URL for authSelfOnboarding')
          return
        }

        const authRes = await fetch(
          `${DASHBOARD_API_BASE}/api/onboarding/authSelfOnboarding`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...authParams,
              device: 'web',
            }),
          },
        )
        if (!authRes.ok) {
          throw new Error(`authSelfOnboarding returned ${authRes.status}`)
        }
        const authData = await authRes.json()
        if (!cancelled) {
          setAuthResponse(authData)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch WM URL or auth')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchWMURLThenAuth()
    return () => {
      cancelled = true
    }
  }, [cifNumber, accountType])

  return {
    wmUrlResponse,
    wmUrl: wmUrlResponse?.url ?? null,
    authResponse,
    loading,
    error,
  }
}
