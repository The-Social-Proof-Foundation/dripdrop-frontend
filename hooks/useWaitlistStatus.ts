'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { DripdropApiError, fetchWaitlistStatus, postUserSession } from '@/lib/dripdrop-api'
import { MYSOCIAL_AUTH_CHANGED_EVENT } from '@/lib/mysocial-auth-events'
import type { WaitlistUserStatus } from '@/lib/waitlist-types'
import { getValidSession } from '@/lib/mysocial-session'

export function useWaitlistStatus(enabled = true) {
  const pathname = usePathname()
  const [status, setStatus] = useState<WaitlistUserStatus | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setStatus(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const session = await getValidSession()
      if (!session) {
        setStatus(null)
        return
      }

      await postUserSession(session.user.email)
      const data = await fetchWaitlistStatus()
      setStatus(data.status)
    } catch (err) {
      if (err instanceof DripdropApiError && err.status === 401) {
        setStatus(null)
        return
      }
      setStatus(null)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void refresh()
  }, [refresh, pathname])

  useEffect(() => {
    const handleAuthChanged = () => void refresh()
    window.addEventListener(MYSOCIAL_AUTH_CHANGED_EVENT, handleAuthChanged)
    return () => window.removeEventListener(MYSOCIAL_AUTH_CHANGED_EVENT, handleAuthChanged)
  }, [refresh])

  return {
    status,
    isApproved: status === 'approved',
    isWaiting: status === 'waiting',
    isLoading,
    refresh,
  }
}
