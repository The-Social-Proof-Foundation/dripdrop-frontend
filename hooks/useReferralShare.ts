'use client'

import { useCallback, useEffect, useState } from 'react'
import { DripdropApiError, fetchWaitlistStatus, postUserSession } from '@/lib/dripdrop-api'
import { MYSOCIAL_AUTH_CHANGED_EVENT } from '@/lib/mysocial-auth-events'
import { getValidSession } from '@/lib/mysocial-session'
import type { WaitlistUserStatus } from '@/lib/waitlist-types'

export function useReferralShare(enabled = true) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [positionEstimate, setPositionEstimate] = useState<number | null>(null)
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistUserStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const session = await getValidSession()
      if (!session) {
        setShareUrl(null)
        setPositionEstimate(null)
        setWaitlistStatus(null)
        return
      }

      await postUserSession(session.user.email)
      const status = await fetchWaitlistStatus()
      setShareUrl(status.shareUrl)
      setPositionEstimate(status.positionEstimate)
      setWaitlistStatus(status.status)
    } catch (err) {
      const message =
        err instanceof DripdropApiError ? err.message : 'Failed to load referral link'
      setError(message)
      setShareUrl(null)
      setPositionEstimate(null)
      setWaitlistStatus(null)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const handleAuthChanged = () => void refresh()
    window.addEventListener(MYSOCIAL_AUTH_CHANGED_EVENT, handleAuthChanged)
    return () => window.removeEventListener(MYSOCIAL_AUTH_CHANGED_EVENT, handleAuthChanged)
  }, [refresh])

  return {
    shareUrl,
    positionEstimate,
    waitlistStatus,
    isLoading,
    error,
    refresh,
  }
}
