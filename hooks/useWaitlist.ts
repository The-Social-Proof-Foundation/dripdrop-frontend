'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  acceptInvite,
  DripdropApiError,
  fetchWaitlistProgram,
  fetchWaitlistStatus,
  postUserOnboard,
  postUserSession,
} from '@/lib/dripdrop-api'
import type { WaitlistProgram, WaitlistStatus } from '@/lib/waitlist-types'
import { getValidSession } from '@/lib/mysocial-session'
import { clearReferralParams, useReferralParams } from './useReferralParams'

const POLL_INTERVAL_MS = 30_000
const INIT_RETRY_ATTEMPTS = 2
const INIT_RETRY_DELAY_MS = 400

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = INIT_RETRY_ATTEMPTS,
): Promise<T> {
  let lastError: unknown
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const retriable =
        err instanceof DripdropApiError &&
        err.status >= 500 &&
        err.code !== 'network_error'
      if (!retriable || i === attempts) throw err
      await new Promise((r) => setTimeout(r, INIT_RETRY_DELAY_MS * (i + 1)))
    }
  }
  throw lastError
}

export type WaitlistPhase =
  | 'loading'
  | 'disabled'
  | 'notJoined'
  | 'onboarding'
  | 'waiting'
  | 'approved'
  | 'error'

function applyStatusPhase(data: WaitlistStatus): WaitlistPhase {
  if (data.status === 'approved') return 'approved'
  if (data.status === 'waiting') return 'waiting'
  return 'notJoined'
}

export function useWaitlist(authReady: boolean) {
  const { referralCode, inviteCode } = useReferralParams()
  const [phase, setPhase] = useState<WaitlistPhase>('loading')
  const [program, setProgram] = useState<WaitlistProgram | null>(null)
  const [status, setStatus] = useState<WaitlistStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadProgram = useCallback(async () => {
    const data = await withRetry(() => fetchWaitlistProgram())
    setProgram(data)
    if (!data.enabled) {
      setPhase('disabled')
      return false
    }
    return true
  }, [])

  const loadStatus = useCallback(async () => {
    const data = await fetchWaitlistStatus()
    setStatus(data)
    setPhase(applyStatusPhase(data))
    return data
  }, [])

  const syncSessionAndStatus = useCallback(async () => {
    const session = await getValidSession()
    if (!session) {
      throw new DripdropApiError('Not authenticated', 401)
    }
    await withRetry(() => postUserSession(session.user.email))
    await withRetry(() => loadStatus())
  }, [loadStatus])

  const joinWaitlist = useCallback(async () => {
    setPhase('onboarding')
    setError(null)
    try {
      const session = await getValidSession()
      if (!session) {
        throw new DripdropApiError('Not authenticated', 401)
      }

      await withRetry(() => postUserSession(session.user.email))
      await withRetry(() =>
        postUserOnboard({
          referralCode,
          inviteCode,
        }),
      )
      const data = await withRetry(() => loadStatus())
      if (data.status === 'waiting' || data.status === 'approved') {
        clearReferralParams()
      }
    } catch (err) {
      const message = err instanceof DripdropApiError ? err.message : 'Failed to join waitlist'
      setError(message)
      setPhase('notJoined')
      throw err
    }
  }, [referralCode, inviteCode, loadStatus])

  const refresh = useCallback(async () => {
    try {
      await loadStatus()
    } catch (err) {
      const message = err instanceof DripdropApiError ? err.message : 'Failed to refresh waitlist status'
      setError(message)
    }
  }, [loadStatus])

  const submitInviteCode = useCallback(async (code: string) => {
    setError(null)
    try {
      const session = await getValidSession()
      if (!session) {
        throw new DripdropApiError('Not authenticated', 401)
      }

      await withRetry(() => postUserSession(session.user.email))
      await acceptInvite(code.trim().toUpperCase())
      const data = await loadStatus()

      if (data.status === 'approved') {
        clearReferralParams()
      }
    } catch (err) {
      const message = err instanceof DripdropApiError ? err.message : 'Invalid invite code'
      setError(message)
      throw err
    }
  }, [loadStatus])

  const retry = useCallback(async () => {
    setPhase('loading')
    setError(null)
    try {
      const enabled = await loadProgram()
      if (!enabled) return
      await syncSessionAndStatus()
    } catch (err) {
      if (
        err instanceof DripdropApiError &&
        (err.code === 'network_error' || err.status >= 500)
      ) {
        setError(
          err.code === 'network_error'
            ? err.message
            : 'Cannot reach DripDrop API. Start dripdrop-backend locally or check DRIPDROP_API_URL.',
        )
      } else {
        const message = err instanceof DripdropApiError ? err.message : 'Something went wrong'
        setError(message)
      }
      setPhase('error')
    }
  }, [loadProgram, syncSessionAndStatus])

  useEffect(() => {
    if (!authReady) return

    let cancelled = false

    async function init() {
      try {
        setPhase('loading')
        setError(null)

        const enabled = await loadProgram()
        if (cancelled || !enabled) return

        const session = await getValidSession()
        if (cancelled) return
        if (!session) return

        await withRetry(() => postUserSession(session.user.email))
        if (cancelled) return
        await withRetry(() => loadStatus())
      } catch (err) {
        if (cancelled) return
        if (
          err instanceof DripdropApiError &&
          (err.code === 'network_error' || err.status >= 500)
        ) {
          setError(
            err.code === 'network_error'
              ? err.message
              : 'Cannot reach DripDrop API. Start dripdrop-backend locally or check DRIPDROP_API_URL.',
          )
          setPhase('error')
          return
        }
        const message = err instanceof DripdropApiError ? err.message : 'Something went wrong'
        setError(message)
        setPhase('error')
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [authReady, loadProgram, loadStatus])

  useEffect(() => {
    if (phase !== 'waiting') return
    const id = window.setInterval(() => {
      refresh()
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [phase, refresh])

  return {
    phase,
    program,
    status,
    error,
    refresh,
    submitInviteCode,
    joinWaitlist,
    retry,
  }
}
