import type { Session } from '@socialproof/mysocial-auth'
import { getMySocialAuth } from '@/lib/mysocial-auth-client'
import {
  getAuthClientId,
  getAuthOrigin,
  getRedirectUri,
  getReturnOrigin,
  storeAuthReturnTo,
  type MySocialProvider,
} from '@/lib/mysocial-auth-config'
import { clearSession, stageSession, storeSession } from '@/lib/mysocial-session'
import { markLoginCelebration } from '@/lib/login-celebration'
import { setZkLoginAuthBusy } from '@/lib/zklogin/auth-busy'
import { loadZkLoginSigner } from '@/lib/zklogin/persist'
import {
  beginZkLogin,
  completeZkLogin,
  endZkLoginRuntime,
  zkLoginPendingRequest,
} from '@/lib/zklogin/session'

type CallbackTokens = {
  idToken: string
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  sub?: string
  email?: string
}

function jwtWalletAddress(token: string | undefined): string | null {
  if (!token || !token.includes('.')) return null
  try {
    const part = token.split('.')[1] || ''
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const payload = JSON.parse(atob(padded)) as { wallet_address?: unknown }
    if (typeof payload.wallet_address !== 'string') return null
    const wallet = payload.wallet_address.trim().toLowerCase()
    return /^0x[0-9a-f]{64}$/.test(wallet) ? wallet : null
  } catch {
    return null
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function startZkLoginRedirect(provider: MySocialProvider, returnTo?: string): Promise<void> {
  const clientId = getAuthClientId()
  if (!clientId) throw new Error('MySocial auth client is not configured.')
  const { nonce, state } = await beginZkLogin()
  void loadZkLoginSigner()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    state,
    nonce,
    return_origin: getReturnOrigin(),
    mode: 'redirect',
    provider,
    code_challenge_method: 'S256',
  })
  if (returnTo) storeAuthReturnTo(returnTo)
  markLoginCelebration()
  window.location.href = `${getAuthOrigin()}/login?${params.toString()}`
}

/**
 * Persist the zkLogin address on the salt server, then refresh so the session JWT includes
 * `wallet_address`. The API rejects session tokens that omit that claim.
 */
async function sessionWithZkAddress(tokens: CallbackTokens, address: string): Promise<Session> {
  if (!tokens.refreshToken) {
    throw new Error('Sign-in did not return a refresh token, so the API session cannot be bound.')
  }

  const saved = await fetch('/api/zklogin/address', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id_token: tokens.idToken }),
  })
  if (!saved.ok) {
    const detail = await saved.text().catch(() => '')
    throw new Error(
      detail.trim()
        ? `Could not bind zkLogin address (${saved.status}): ${detail.trim().slice(0, 200)}`
        : `Could not bind zkLogin address (${saved.status}).`,
    )
  }
  const derived = (await saved.json()) as { address?: string }
  if (typeof derived.address === 'string' && derived.address.toLowerCase() !== address.toLowerCase()) {
    throw new Error('Salt address did not match the zkLogin wallet address.')
  }

  let lastError: unknown = null
  for (let attempt = 0; attempt < 3; attempt++) {
    let refreshed: Session | null
    try {
      refreshed = await getMySocialAuth().refresh()
    } catch (err) {
      lastError = err
      await delay(400 * (attempt + 1))
      continue
    }
    if (!refreshed) throw new Error('Sign in again to refresh zkLogin.')
    if (jwtWalletAddress(refreshed.session_access_token ?? refreshed.access_token)) return refreshed
    // Salt may need a beat after /zklogin-address before refresh mints wallet_address.
    await delay(400 * (attempt + 1))
  }
  if (lastError instanceof Error) throw lastError
  throw new Error('Session JWT is missing wallet_address after bind. Sign out and sign in again.')
}

async function storeZkLoginSession(tokens: CallbackTokens): Promise<void> {
  const oauthSession: Session = {
    access_token: tokens.accessToken,
    session_access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    id_token: tokens.idToken,
    expires_at: tokens.expiresIn != null ? Date.now() + tokens.expiresIn * 1000 : Date.now() + 36e5,
    sub: tokens.sub ?? '',
    user: { sub: tokens.sub, email: tokens.email },
  }
  // Refresh needs the tokens in storage; the app only sees the session once it carries an address.
  stageSession(oauthSession)
  const address = await completeZkLogin({ jwt: tokens.idToken, accessToken: tokens.accessToken })

  const bound =
    jwtWalletAddress(tokens.accessToken) === address.toLowerCase()
      ? oauthSession
      : await sessionWithZkAddress(tokens, address)
  storeSession({
    ...bound,
    user: { ...bound.user, address, email: bound.user?.email ?? tokens.email },
  })
}

let redirectCompletion: Promise<void> | null = null

/** Finishes the OAuth redirect: prove, bind, and store the session. Throws a user-facing message on failure. */
export function completeZkLoginRedirect(): Promise<void> {
  redirectCompletion ??= finishZkLoginRedirect().finally(() => {
    redirectCompletion = null
  })
  return redirectCompletion
}

async function finishZkLoginRedirect(): Promise<void> {
  const params = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams((window.location.hash || '').slice(1))
  const authError = params.get('error') ?? hash.get('error')
  if (authError) {
    throw new Error(params.get('error_description') ?? hash.get('error_description') ?? authError)
  }

  const expected = zkLoginPendingRequest()
  if (!expected) throw new Error('Authentication session expired. Please try again.')
  if (params.get('state') !== expected.state) throw new Error('Sign-in state did not match. Please try again.')
  if (params.get('nonce') !== expected.nonce) throw new Error('Sign-in nonce did not match.')

  const idToken = hash.get('id_token') ?? params.get('id_token')
  const accessToken =
    hash.get('session_access_token') ?? hash.get('access_token') ?? params.get('session_access_token')
  if (!idToken || !accessToken) throw new Error('Sign-in did not return an OAuth token.')

  const expiresIn = hash.get('expires_in')
  setZkLoginAuthBusy(true)
  try {
    await storeZkLoginSession({
      idToken,
      accessToken,
      refreshToken: hash.get('refresh_token') ?? undefined,
      expiresIn: expiresIn ? Number(expiresIn) : undefined,
      sub: params.get('sub') ?? undefined,
      email: params.get('email') ?? undefined,
    })
  } catch (err) {
    clearSession()
    endZkLoginRuntime()
    throw err
  } finally {
    setZkLoginAuthBusy(false)
  }
}
