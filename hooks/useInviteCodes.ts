'use client'

import { useCallback, useEffect, useState } from 'react'
import { createInvite, DripdropApiError, fetchInvites } from '@/lib/dripdrop-api'
import type { InviteCode } from '@/lib/waitlist-types'
import { MAX_INVITES_PER_USER } from '@/lib/waitlist-types'

function isActiveInvite(invite: InviteCode): boolean {
  if (invite.status !== 'pending') return false
  if (!invite.expiresAt) return true
  return new Date(invite.expiresAt).getTime() > Date.now()
}

export function useInviteCodes(enabled: boolean) {
  const [invites, setInvites] = useState<InviteCode[]>([])
  const [canManage, setCanManage] = useState(false)
  const [isLoading, setIsLoading] = useState(enabled)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInvites = useCallback(async () => {
    if (!enabled) {
      setCanManage(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchInvites()
      setInvites(data.invites)
      setCanManage(true)
    } catch (err) {
      if (err instanceof DripdropApiError && err.status === 403) {
        setCanManage(false)
        setInvites([])
        return
      }
      if (err instanceof DripdropApiError && err.status === 404) {
        setCanManage(false)
        setInvites([])
        return
      }
      const message = err instanceof DripdropApiError ? err.message : 'Failed to load invites'
      setError(message)
      setCanManage(false)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void loadInvites()
  }, [loadInvites])

  const activeCount = invites.filter(isActiveInvite).length

  const mintInvite = useCallback(async () => {
    setIsCreating(true)
    setError(null)
    try {
      const { invite } = await createInvite()
      setInvites((prev) => [invite, ...prev])
      return invite
    } catch (err) {
      const message = err instanceof DripdropApiError ? err.message : 'Failed to create invite'
      setError(message)
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [])

  return {
    invites,
    activeCount,
    maxInvites: MAX_INVITES_PER_USER,
    canManage,
    isLoading,
    isCreating,
    error,
    mintInvite,
    refresh: loadInvites,
  }
}
