/**
 * Central API client for the dashboard Fastify backend.
 * All fetch calls for dashboard and onboarding are made through these functions.
 */

// Dynamically resolve the API host so it works from both localhost and LAN (e.g. phone)
const API_HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
export const DASHBOARD_API_BASE = `http://${API_HOST}:4001`

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export interface WMURLResponse {
  url: string
}

export interface AuthSelfOnboardingBody {
  sessionId: string
  bwayparam: string
  param: string
  device?: string
}

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
export function parseWMUrlToAuthParams(url: string): AuthSelfOnboardingBody | null {
  if (!url || !url.startsWith('?')) return null
  const params = new URLSearchParams(url)
  const sessionId = params.get('uniqueId')
  const bwayparam = params.get('bwayparam')
  const param = params.get('param')
  if (!sessionId || !bwayparam || !param) return null
  return { sessionId, bwayparam, param }
}

export async function getWMURL(cifNumber: string, accountType: string): Promise<WMURLResponse> {
  const params = new URLSearchParams({ cifNumber, accountType })
  const res = await fetch(`${DASHBOARD_API_BASE}/api/onboarding/getWMURL?${params}`)
  if (!res.ok) throw new Error(`getWMURL returned ${res.status}`)
  return res.json()
}

export async function authSelfOnboarding(body: AuthSelfOnboardingBody): Promise<AuthSelfOnboardingResponse> {
  const res = await fetch(`${DASHBOARD_API_BASE}/api/onboarding/authSelfOnboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, device: body.device ?? 'web' }),
  })
  if (!res.ok) throw new Error(`authSelfOnboarding returned ${res.status}`)
  return res.json()
}

// ---------------------------------------------------------------------------
// Dashboard (portfolio & bank)
// ---------------------------------------------------------------------------

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`,
  }
}

export async function fetchPortfolio(
  clientId: number,
  accessToken: string
): Promise<unknown> {
  const res = await fetch(
    `${DASHBOARD_API_BASE}/api/dashboard/${clientId}/portfolio?fromDate=2025-01-01&currencyId=247`,
    { headers: authHeaders(accessToken) }
  )
  if (!res.ok) throw new Error(`Portfolio API returned ${res.status}`)
  return res.json()
}

export async function fetchBank(
  clientId: number,
  accessToken: string
): Promise<unknown> {
  const res = await fetch(
    `${DASHBOARD_API_BASE}/api/dashboard/${clientId}/bank?fromDate=2025-01-01&currencyId=247`,
    { headers: authHeaders(accessToken) }
  )
  if (!res.ok) throw new Error(`Bank API returned ${res.status}`)
  return res.json()
}
