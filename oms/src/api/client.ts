/**
 * Central API client for the OMS Fastify backend.
 * All fetch calls for instruments and orders go through these functions.
 */

// Dynamically resolve the API host so it works from both localhost and LAN (e.g. phone)
const API_HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
export const OMS_API_BASE = `http://${API_HOST}:4002`

// ---------------------------------------------------------------------------
// Instruments
// ---------------------------------------------------------------------------

export async function fetchInstruments(): Promise<unknown[]> {
  const res = await fetch(`${OMS_API_BASE}/api/instruments`)
  if (!res.ok) throw new Error(`API returned ${res.status}`)
  return res.json()
}

export async function fetchInstrumentById(id: string): Promise<unknown> {
  const res = await fetch(`${OMS_API_BASE}/api/instruments/${id}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Instrument ${id} not found`)
    throw new Error(`API returned ${res.status}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface SubmitOrderPayload {
  instrumentId: string
  ticker: string
  currency: string
  transactionType: string
  orderType: string
  orderBy: string
  quantity: string
  amount: string
  limitPrice: string
  bankAccountId: string
  totalAmount: number
  feeExceptionApplicable: boolean
  exceptionFeePercent: string
  placeFirstOrderToday?: boolean
  startDate?: string
  frequency?: string
  tenure?: string
  numberOfUnits?: string
  installmentAmount?: string
}

export interface SubmitOrderResult {
  ok: boolean
  data: { status?: string; message?: string; [key: string]: unknown }
}

export async function submitOrder(payload: SubmitOrderPayload): Promise<SubmitOrderResult> {
  const res = await fetch(`${OMS_API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  return { ok: res.ok, data }
}
