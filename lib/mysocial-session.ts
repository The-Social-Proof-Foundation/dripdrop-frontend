import type { AuthUser, Session } from '@socialproof/mysocial-auth'
import { getMySocialAuth, resetMySocialAuth } from './mysocial-auth-client'
import { notifyAuthChanged } from './mysocial-auth-events'
import { AUTH_SESSION_KEY, LEGACY_SESSION_KEY } from './mysocial-auth-config'
import { endZkLoginRuntime } from './zklogin/session'

/** SDK session with the wallet address and email resolved for app use. */
export type MySocialSession = Omit<Session, 'user'> & {
  user: Omit<AuthUser, 'address' | 'email'> & { address: string; email: string | null }
}

type LegacySession = {
  sessionAccessToken?: string
  refreshToken?: string
  expiresAt?: number
  user?: { sub?: string; address?: string; email?: string | null }
  salt?: string | null
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

function migrateLegacySession(): void {
  if (typeof window === 'undefined') return
  const raw = sessionStorage.getItem(LEGACY_SESSION_KEY)
  if (!raw) return
  sessionStorage.removeItem(LEGACY_SESSION_KEY)
  if (sessionStorage.getItem(AUTH_SESSION_KEY)) return
  try {
    const legacy = JSON.parse(raw) as LegacySession
    if (!legacy.sessionAccessToken || !legacy.refreshToken || !legacy.user?.address) return
    const session: Session = {
      access_token: legacy.sessionAccessToken,
      session_access_token: legacy.sessionAccessToken,
      refresh_token: legacy.refreshToken,
      expires_at: legacy.expiresAt ?? 0,
      sub: legacy.user.sub ?? '',
      user: {
        sub: legacy.user.sub,
        address: legacy.user.address,
        email: legacy.user.email ?? undefined,
      },
      salt: legacy.salt ?? undefined,
    }
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
    resetMySocialAuth()
  } catch {
    // Unreadable legacy session: the user signs in again.
  }
}

/** Refreshes can return a user without `address`; the bound session JWT carries it as `wallet_address`. */
function toAppSession(session: Session): MySocialSession | null {
  const token = session.session_access_token ?? session.access_token
  const address = session.user?.address || jwtClaim(token, 'wallet_address')
  if (!address) return null
  const email =
    session.user?.email || jwtClaim(token, 'email') || jwtClaim(session.id_token, 'email') || null
  return { ...session, user: { ...session.user, address, email } }
}

function readStoredSession(): Session | null {
  if (typeof window === 'undefined') return null
  migrateLegacySession()
  const raw = sessionStorage.getItem(AUTH_SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

/** Synchronous read without refresh, for first render. */
export function loadStoredSession(): MySocialSession | null {
  const session = readStoredSession()
  return session ? toAppSession(session) : null
}

/** Writes tokens the SDK can refresh with, without announcing a sign-in. */
export function stageSession(session: Session): void {
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
  resetMySocialAuth()
}

export function storeSession(session: Session): void {
  stageSession(session)
  notifyAuthChanged()
}

export function clearSession(): void {
  sessionStorage.removeItem(AUTH_SESSION_KEY)
  resetMySocialAuth()
  notifyAuthChanged()
}

/** Session refreshed through the SDK when it is near expiry. Null when signed out or revoked. */
export async function getValidSession(): Promise<MySocialSession | null> {
  const hadSession = readStoredSession() !== null
  const session = await getMySocialAuth().getSession()
  if (!session) {
    if (hadSession) notifyAuthChanged()
    return null
  }
  return toAppSession(session)
}

export async function getApiAccessToken(): Promise<string | null> {
  const session = await getValidSession()
  if (!session) return null
  return (await getMySocialAuth().getAccessTokenForApi()) ?? null
}

export async function signOutSession(): Promise<void> {
  migrateLegacySession()
  await getMySocialAuth().signOut()
  endZkLoginRuntime()
  clearSession()
}
