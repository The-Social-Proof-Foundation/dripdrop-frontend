import {
  getAuthClientId,
  getAuthHost,
  getRedirectUri,
  getReturnOrigin,
  getSaltServiceUrl,
  storeAuthPending,
  storeAuthReturnTo,
  type MySocialProvider,
} from './mysocial-auth-config'
import { generatePkce, randomUrlSafeValue } from './pkce'

export interface MySocialUser {
  sub: string
  address: string
  email: string | null
}

export interface MySocialSession {
  sessionAccessToken: string
  refreshToken: string
  expiresAt: number
  user: MySocialUser
  salt: string | null
}

export class MySocialAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MySocialAuthError'
  }
}

export interface RefreshResponse {
  session_access_token: string
  refresh_token: string
  expires_in: number
  user: { address: string }
}

export class SessionRevokedError extends Error {
  constructor(message = 'Session expired. Please sign in again.') {
    super(message)
    this.name = 'SessionRevokedError'
  }
}

function jwtClaim(jwt: string | null | undefined, key: string): string | null {
  if (!jwt) return null
  const parts = jwt.split('.')
  if (parts.length < 2) return null
  try {
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (payload.length % 4 !== 0) payload += '='
    const json = JSON.parse(atob(payload)) as Record<string, unknown>
    const value = json[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    return null
  } catch {
    return null
  }
}

function required(key: string, values: Record<string, string>): string {
  const value = values[key]
  if (!value) throw new MySocialAuthError(`MySocial callback is missing ${key}.`)
  return value
}

export function buildLoginUrl(
  provider: MySocialProvider,
  state: string,
  nonce: string,
  codeChallenge: string
): string {
  const clientId = getAuthClientId()
  if (!clientId) {
    throw new MySocialAuthError('NEXT_PUBLIC_AUTH_CLIENT_ID is not configured.')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    state,
    nonce,
    return_origin: getReturnOrigin(),
    mode: 'redirect',
    provider,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  return `https://${getAuthHost()}/login?${params.toString()}`
}

export async function startSignIn(provider: MySocialProvider, returnTo?: string): Promise<void> {
  const state = randomUrlSafeValue()
  const nonce = randomUrlSafeValue()
  const { codeVerifier, codeChallenge } = await generatePkce()
  storeAuthReturnTo(returnTo || '/waitlist')
  storeAuthPending(state, nonce, codeVerifier)
  const url = buildLoginUrl(provider, state, nonce, codeChallenge)
  window.location.assign(url)
}

export function parseAuthCallback(
  url: string,
  expectedState: string,
  expectedNonce: string
): MySocialSession {
  const parsed = new URL(url)
  const clientId = getAuthClientId()

  const query = Object.fromEntries(parsed.searchParams.entries())
  const fragmentRaw = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash
  const fragment = Object.fromEntries(new URLSearchParams(fragmentRaw).entries())

  if (query.error) {
    throw new MySocialAuthError(query.error)
  }

  if (query.state !== expectedState) {
    throw new MySocialAuthError('Authentication state did not match.')
  }
  if (query.nonce !== expectedNonce) {
    throw new MySocialAuthError('Authentication nonce did not match.')
  }
  if (query.clientId !== clientId) {
    throw new MySocialAuthError('Authentication client ID did not match.')
  }

  const sessionAccessToken = required('session_access_token', fragment)
  const refreshToken = required('refresh_token', fragment)
  const sub = required('sub', query)
  const address = required('address', query)
  const salt = required('salt', query)
  const expiresIn = Number(fragment.expires_in) || 1800

  const email =
    query.email?.trim() ||
    fragment.email?.trim() ||
    jwtClaim(sessionAccessToken, 'email') ||
    jwtClaim(fragment.id_token, 'email') ||
    null

  return {
    sessionAccessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
    user: { sub, address, email },
    salt,
  }
}

export async function refreshSession(refreshToken: string): Promise<RefreshResponse> {
  const url = `${getSaltServiceUrl()}/auth/refresh`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (res.status === 401) {
    throw new SessionRevokedError()
  }
  if (!res.ok) {
    const text = await res.text()
    throw new MySocialAuthError(`Session refresh failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as RefreshResponse
  if (!data.session_access_token || !data.refresh_token) {
    throw new MySocialAuthError('Invalid refresh response.')
  }
  return data
}

export async function logoutSession(refreshToken: string): Promise<void> {
  const url = `${getSaltServiceUrl()}/auth/logout`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok && res.status !== 204) {
    const text = await res.text()
    throw new MySocialAuthError(`Logout failed: ${res.status} ${text}`)
  }
}

export function isAuthCallbackPath(pathname: string): boolean {
  return pathname === '/auth/callback'
}
