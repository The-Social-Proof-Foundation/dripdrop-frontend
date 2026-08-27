'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useMySocialAuth } from '@/hooks/useMySocialAuth'
import {
  DripdropApiError,
  fetchWaitlistProgram,
  fetchWaitlistStatus,
  postUserSession,
} from '@/lib/dripdrop-api'
import type { WaitlistUserStatus } from '@/lib/waitlist-types'
import { getValidSession } from '@/lib/mysocial-session'
import { useReferralHref } from '@/hooks/useReferralHref'

type CtaState = 'loading' | 'guest' | 'notJoined' | 'waiting' | 'approved' | 'unavailable'

function resolveCta(state: CtaState): { label: string; href: string } {
  switch (state) {
    case 'waiting':
      return { label: 'View your spot', href: '/waitlist' }
    case 'approved':
      return { label: 'Early access unlocked', href: '/waitlist' }
    case 'notJoined':
    case 'unavailable':
      return { label: 'Join the Waitlist', href: '/waitlist' }
    case 'guest':
    default:
      return { label: 'Join the Waitlist', href: '/login?next=/waitlist' }
  }
}

export function HomeWaitlistCta() {
  const { isAuthenticated, isLoading: authLoading } = useMySocialAuth()
  const [state, setState] = useState<CtaState>('loading')

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      setState('guest')
      return
    }

    let cancelled = false

    async function load() {
      try {
        const program = await fetchWaitlistProgram()
        if (cancelled) return
        if (!program.enabled) {
          setState('unavailable')
          return
        }

        const session = await getValidSession()
        if (cancelled || !session) {
          setState('guest')
          return
        }

        await postUserSession(session.user.email)
        if (cancelled) return

        const status = await fetchWaitlistStatus()
        if (cancelled) return

        const map: Record<WaitlistUserStatus, CtaState> = {
          waiting: 'waiting',
          approved: 'approved',
          none: 'notJoined',
        }
        setState(map[status.status] ?? 'notJoined')
      } catch (err) {
        if (cancelled) return
        if (err instanceof DripdropApiError && (err.code === 'network_error' || err.status >= 500)) {
          setState('unavailable')
          return
        }
        setState(isAuthenticated ? 'notJoined' : 'guest')
      }
    }

    setState('loading')
    load()

    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated])

  const { label, href: baseHref } = resolveCta(state)
  const href = useReferralHref(baseHref)
  const isLoading = authLoading || state === 'loading'

  return (
    <Button
      asChild
      size="lg"
      disabled={isLoading}
      className="h-12 px-8 rounded-full text-base font-semibold font-sans bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg disabled:opacity-70"
    >
      <Link href={href}>{isLoading ? 'Join the Waitlist' : label}</Link>
    </Button>
  )
}
