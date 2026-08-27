import type {
  InviteCode,
  InvitePreview,
  OnboardResult,
  WaitlistProgram,
  WaitlistStatus,
} from './waitlist-types'
import { getValidSession } from './mysocial-session'

function getBackendUrl(): string {
  // Browser calls same-origin proxy; Next rewrites to DRIPDROP_API_URL server-side.
  if (typeof window !== 'undefined') {
    return '/api/backend'
  }
  const url =
    process.env.DRIPDROP_API_URL ||
    process.env.NEXT_PUBLIC_DRIPDROP_API_URL ||
    'http://127.0.0.1:5050'
  return url.replace(/\/$/, '')
}

export class DripdropApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'DripdropApiError'
    this.status = status
    this.code = code
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = false, ...init } = options
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string>),
  }

  if (auth) {
    const session = await getValidSession()
    if (!session) {
      throw new DripdropApiError('Not authenticated', 401)
    }
    headers.Authorization = `Bearer ${session.sessionAccessToken}`
  }

  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  let res: Response
  try {
    res = await fetch(`${getBackendUrl()}${path}`, { ...init, headers })
  } catch {
    const hint =
      typeof window !== 'undefined'
        ? 'Start dripdrop-backend locally (DRIPDROP_API_URL in .env, default http://127.0.0.1:5050).'
        : 'Set DRIPDROP_API_URL or NEXT_PUBLIC_DRIPDROP_API_URL.'
    throw new DripdropApiError(`Cannot reach DripDrop API. ${hint}`, 0, 'network_error')
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const bodyError = (data as { error?: string; message?: string }).error
    const bodyMessage = (data as { message?: string }).message
    const message = bodyError || bodyMessage || `Request failed (${res.status})`
    const code = (data as { code?: string }).code

    // Next.js rewrite proxy returns 500 with no JSON body when backend is down.
    if (res.status >= 500 && !bodyError && !bodyMessage) {
      const hint =
        typeof window !== 'undefined'
          ? 'Start dripdrop-backend locally (DRIPDROP_API_URL in .env, default http://127.0.0.1:5050).'
          : 'Set DRIPDROP_API_URL or NEXT_PUBLIC_DRIPDROP_API_URL.'
      throw new DripdropApiError(`Cannot reach DripDrop API. ${hint}`, 0, 'network_error')
    }

    throw new DripdropApiError(message, res.status, code)
  }

  return data as T
}

export async function fetchWaitlistProgram(): Promise<WaitlistProgram> {
  return apiFetch<WaitlistProgram>('/waitlist/program')
}

export async function fetchWaitlistStatus(): Promise<WaitlistStatus> {
  return apiFetch<WaitlistStatus>('/waitlist/status', { auth: true })
}

export async function postUserSession(email: string | null): Promise<void> {
  await apiFetch('/user/session', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(email ? { email } : {}),
  })
}

export async function postUserOnboard(params: {
  referralCode?: string | null
  inviteCode?: string | null
}): Promise<OnboardResult> {
  const body: Record<string, string> = {}
  if (params.referralCode) body.referralCode = params.referralCode
  if (params.inviteCode) body.inviteCode = params.inviteCode
  return apiFetch<OnboardResult>('/user/onboard', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(body),
  })
}

export async function acceptInvite(inviteCode: string): Promise<{ invite: InviteCode }> {
  return apiFetch<{ invite: InviteCode }>('/invites/accept', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ inviteCode }),
  })
}

export async function fetchInvites(): Promise<{ invites: InviteCode[] }> {
  return apiFetch<{ invites: InviteCode[] }>('/invites', { auth: true })
}

export async function createInvite(): Promise<{ invite: InviteCode }> {
  return apiFetch<{ invite: InviteCode }>('/invites', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({}),
  })
}

export async function fetchInvitePreview(code: string): Promise<InvitePreview> {
  return apiFetch<InvitePreview>(`/invites/${encodeURIComponent(code)}`)
}
