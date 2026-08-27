export type MySocialProvider = 'google' | 'apple'

const AUTH_STATE_KEY = 'mysocial_auth_state'
const AUTH_NONCE_KEY = 'mysocial_auth_nonce'
const AUTH_CODE_VERIFIER_KEY = 'mysocial_auth_code_verifier'
const AUTH_RETURN_TO_KEY = 'auth_return_to'
export const SESSION_STORAGE_KEY = 'mysocial_session'

export function getAuthHost(): string {
  return process.env.NEXT_PUBLIC_MYSOCIAL_AUTH_HOST || 'auth.testnet.mysocial.network'
}

export function getSaltServiceUrl(): string {
  return (process.env.NEXT_PUBLIC_MYSOCIAL_SALT_URL || 'https://salt.testnet.mysocial.network').replace(/\/$/, '')
}

export function getAuthClientId(): string {
  return process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || ''
}

export function getSiteOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return (process.env.NEXT_PUBLIC_BASE_URL || 'https://dripdrop.social').replace(/\/$/, '')
}

export function getRedirectUri(): string {
  return `${getSiteOrigin()}/auth/callback`
}

export function getReturnOrigin(): string {
  return getSiteOrigin()
}

export function getMySocialWebUrl(): string {
  return (process.env.NEXT_PUBLIC_MYSOCIAL_WEB_URL || 'https://www.mysocial.network').replace(/\/$/, '')
}

export function storeAuthReturnTo(path: string): void {
  if (typeof window === 'undefined') return
  const safe =
    path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/auth/callback')
      ? path
      : '/waitlist'
  sessionStorage.setItem(AUTH_RETURN_TO_KEY, safe)
}

export function consumeAuthReturnTo(): string {
  if (typeof window === 'undefined') return '/waitlist'
  const path = sessionStorage.getItem(AUTH_RETURN_TO_KEY)
  sessionStorage.removeItem(AUTH_RETURN_TO_KEY)
  if (path && path.startsWith('/') && !path.startsWith('//')) return path
  return '/waitlist'
}

export function storeAuthPending(state: string, nonce: string, codeVerifier: string): void {
  sessionStorage.setItem(AUTH_STATE_KEY, state)
  sessionStorage.setItem(AUTH_NONCE_KEY, nonce)
  sessionStorage.setItem(AUTH_CODE_VERIFIER_KEY, codeVerifier)
}

export function consumeAuthPending(): { state: string; nonce: string; codeVerifier: string } | null {
  const state = sessionStorage.getItem(AUTH_STATE_KEY)
  const nonce = sessionStorage.getItem(AUTH_NONCE_KEY)
  const codeVerifier = sessionStorage.getItem(AUTH_CODE_VERIFIER_KEY)
  sessionStorage.removeItem(AUTH_STATE_KEY)
  sessionStorage.removeItem(AUTH_NONCE_KEY)
  sessionStorage.removeItem(AUTH_CODE_VERIFIER_KEY)
  if (!state || !nonce || !codeVerifier) return null
  return { state, nonce, codeVerifier }
}

export function getExpectedAuthPending(): { state: string; nonce: string } | null {
  const state = sessionStorage.getItem(AUTH_STATE_KEY)
  const nonce = sessionStorage.getItem(AUTH_NONCE_KEY)
  if (!state || !nonce) return null
  return { state, nonce }
}
