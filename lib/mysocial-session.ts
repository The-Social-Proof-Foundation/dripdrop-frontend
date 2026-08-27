import {
  logoutSession,
  refreshSession,
  type MySocialSession,
  SessionRevokedError,
} from './mysocial-auth-client'
import { notifyAuthChanged } from './mysocial-auth-events'
import { SESSION_STORAGE_KEY } from './mysocial-auth-config'

const REFRESH_BUFFER_MS = 2 * 60 * 1000

export function loadStoredSession(): MySocialSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MySocialSession
    if (!parsed.sessionAccessToken || !parsed.refreshToken) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSession(session: MySocialSession): void {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  notifyAuthChanged()
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
  notifyAuthChanged()
}

export function getAuthHeaders(sessionAccessToken: string): { Authorization: string } {
  return { Authorization: `Bearer ${sessionAccessToken}` }
}

export async function refreshSessionIfNeeded(session: MySocialSession): Promise<MySocialSession> {
  if (Date.now() < session.expiresAt - REFRESH_BUFFER_MS) {
    return session
  }

  const result = await refreshSession(session.refreshToken)
  const updated: MySocialSession = {
    ...session,
    sessionAccessToken: result.session_access_token,
    refreshToken: result.refresh_token,
    expiresAt: Date.now() + result.expires_in * 1000,
    user: {
      ...session.user,
      address: result.user.address || session.user.address,
    },
  }
  saveSession(updated)
  return updated
}

export async function getValidSession(): Promise<MySocialSession | null> {
  const stored = loadStoredSession()
  if (!stored) return null
  try {
    const refreshed = await refreshSessionIfNeeded(stored)
    return refreshed
  } catch (err) {
    if (err instanceof SessionRevokedError) {
      clearSession()
      return null
    }
    throw err
  }
}

export async function signOutSession(session: MySocialSession | null): Promise<void> {
  const active = session ?? loadStoredSession()
  if (active?.refreshToken) {
    try {
      await logoutSession(active.refreshToken)
    } catch {
      // Best-effort logout
    }
  }
  clearSession()
}
