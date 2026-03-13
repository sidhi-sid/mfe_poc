import { useQuery } from "@tanstack/react-query";

const DASHBOARD_API_BASE = "http://localhost:4001";

interface AuthSelfOnboardingBody {
  sessionId: string;
  bwayparam: string;
  param: string;
  device?: string;
}

interface AuthSelfOnboardingResponse {
  token?: string;
  cif?: string;
  [key: string]: unknown;
}

interface AccountResponse {
  cifNumber?: string;
  [key: string]: unknown;
}

export interface OnboardingResult {
  auth: AuthSelfOnboardingResponse;
  account: AccountResponse;
}

function parseWMUrlToAuthParams(url: string): AuthSelfOnboardingBody | null {
  if (!url || !url.startsWith("?")) return null;
  const params = new URLSearchParams(url);
  const sessionId = params.get("uniqueId");
  const bwayparam = params.get("bwayparam");
  const param = params.get("param");
  if (!sessionId || !bwayparam || !param) return null;
  return { sessionId, bwayparam, param };
}

async function callAuthSelfOnboarding(body: AuthSelfOnboardingBody): Promise<AuthSelfOnboardingResponse> {
  const res = await fetch(`${DASHBOARD_API_BASE}/api/onboarding/authSelfOnboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, device: body.device ?? "web" }),
  });
  if (!res.ok) {
    throw new Error(`authSelfOnboarding returned ${res.status}`);
  }
  return res.json();
}

async function fetchAccountByCifNumber(cifNumber: string, accessToken: string): Promise<AccountResponse> {
  const params = new URLSearchParams({ cifNumber });
  const res = await fetch(`${DASHBOARD_API_BASE}/api/account/fetchAccountByCifNumber?${params}`, {
    method: "GET",
    headers: {
      Authorization: accessToken,
    },
  });
  if (!res.ok) throw new Error(`fetchAccountByCifNumber returned ${res.status}`);
  return res.json();
}

// Dedupe authSelfOnboarding for React Strict Mode
let authInFlight: Promise<AuthSelfOnboardingResponse> | null = null;
let authInFlightKey: string | null = null;

function getDeduplicatedAuth(wmUrl: string, cifFromHost: string | null): Promise<AuthSelfOnboardingResponse> {
  const key = `${wmUrl}|${cifFromHost}`;
  if (authInFlight && authInFlightKey === key) {
    return authInFlight;
  }
  const authParams = parseWMUrlToAuthParams(wmUrl);
  if (!authParams) {
    return Promise.reject(new Error("Could not parse wmUrl for authSelfOnboarding"));
  }
  authInFlightKey = key;
  authInFlight = callAuthSelfOnboarding(authParams).finally(() => {
    authInFlight = null;
    authInFlightKey = null;
  });
  return authInFlight;
}

/**
 * Flow: getWMURL → authSelfOnboarding → modules (authenticated) → fetchAccountByCifNumber → portfolio/bank
 */
export function useOnboardingAuth() {
  const searchParams = new URLSearchParams(window.location.search);
  const wmUrlFromHost = searchParams.get("wmUrl");
  const cifFromHost = searchParams.get("cifNumber");

  const query = useQuery<AuthSelfOnboardingResponse, Error>({
    queryKey: ["onboardingAuth", wmUrlFromHost, cifFromHost],
    queryFn: () => getDeduplicatedAuth(wmUrlFromHost!, cifFromHost),
    enabled: !!wmUrlFromHost,
    retry: false,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    loading: query.isPending,
    error: query.error ?? null,
    auth: query.data ?? null,
  };
}

/**
 * Fetches account by CIF after auth and modules. Enabled only when we have token + cif + modules loaded.
 */
export function useAccountData(
  auth: AuthSelfOnboardingResponse | null,
  modulesLoaded: boolean
): { account: AccountResponse | null; loading: boolean; error: Error | null } {
  const searchParams = new URLSearchParams(window.location.search);
  const cifFromHost = searchParams.get("cifNumber");
  const cif = (auth?.cif as string | undefined) ?? cifFromHost ?? null;
  const token = auth?.token ?? null;
  const enabled = !!token && !!cif && modulesLoaded;

  const query = useQuery<AccountResponse, Error>({
    queryKey: ["accountByCif", token, cif],
    queryFn: () => fetchAccountByCifNumber(cif!, token!),
    enabled,
    retry: false,
    staleTime: Infinity,
  });

  return {
    account: query.data ?? null,
    loading: query.isPending,
    error: query.error ?? null,
  };
}
