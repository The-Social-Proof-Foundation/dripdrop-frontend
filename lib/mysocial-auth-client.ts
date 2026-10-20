import { createMySocialAuth, type MySocialAuth } from '@socialproof/mysocial-auth'
import {
  getAuthClientId,
  getAuthOrigin,
  getRedirectUri,
  getSaltServiceUrl,
} from './mysocial-auth-config'

let authInstance: MySocialAuth | null = null

export function getMySocialAuth(): MySocialAuth {
  if (!authInstance) {
    authInstance = createMySocialAuth({
      apiBaseUrl: getSaltServiceUrl(),
      authOrigin: getAuthOrigin(),
      clientId: getAuthClientId(),
      redirectUri: getRedirectUri(),
      storage: 'session',
      proactiveRefresh: false,
    })
  }
  return authInstance
}

/** The SDK caches the session in memory; drop the instance after writing storage directly. */
export function resetMySocialAuth(): void {
  authInstance = null
}
