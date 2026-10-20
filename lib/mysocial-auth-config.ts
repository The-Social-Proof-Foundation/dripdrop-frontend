export type MySocialProvider = 'google' | 'apple'

const AUTH_RETURN_TO_KEY = 'auth_return_to'

/** sessionStorage key `@socialproof/mysocial-auth` reads and writes its session under. */
export const AUTH_SESSION_KEY = 'mysocial_auth_session'

/** Pre-zkLogin session shape, migrated once into AUTH_SESSION_KEY. */
export const LEGACY_SESSION_KEY = 'mysocial_session'

export function getAuthHost(): string {
  return process.env.NEXT_PUBLIC_MYSOCIAL_AUTH_HOST || 'auth.testnet.mysocial.network'
}

export function getAuthOrigin(): string {
  return `https://${getAuthHost()}`
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
