'use client'

import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { RequireAuth } from '@/components/waitlist/require-auth'
import { WaitlistCenteredLayout } from '@/components/waitlist/waitlist-centered-layout'
import { JoinWaitlistPanel } from '@/components/waitlist/join-waitlist-panel'
import { WaitingRoom } from '@/components/waitlist/waiting-room'
import { ApprovedPanel } from '@/components/waitlist/approved-panel'
import { useMySocialAuth } from '@/hooks/useMySocialAuth'
import { useWaitlist, type WaitlistPhase } from '@/hooks/useWaitlist'
import { useReferralParams } from '@/hooks/useReferralParams'
import { getVideoDurationLabel } from '@/lib/video-config'

function getWaitlistCopy(phase: WaitlistPhase): { title: string; subtitle: string } {
  switch (phase) {
    case 'waiting':
      return {
        title: "You're on the waitlist!",
        subtitle: 'Share your link to move up.',
      }
    case 'approved':
      return {
        title: "You're in!",
        subtitle: 'Download the app and start creating.',
      }
    case 'notJoined':
      return {
        title: 'Join the waitlist',
        subtitle: `Reserve early access to the ${getVideoDurationLabel()} video economy you own.`,
      }
    default:
      return {
        title: 'Join the waitlist',
        subtitle: `Reserve early access to DripDrop.`,
      }
  }
}

function WaitlistDashboard() {
  const { isLoading: authLoading, session } = useMySocialAuth()
  const { hasReferral, hasInvite } = useReferralParams()
  const { phase, status, error, submitInviteCode, joinWaitlist, retry } = useWaitlist(
    !authLoading,
  )

  const { title, subtitle } = useMemo(() => getWaitlistCopy(phase), [phase])

  let content: React.ReactNode

  if (authLoading || phase === 'loading') {
    content = (
      <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  } else if (phase === 'disabled') {
    content = (
      <p className="text-sm text-muted-foreground text-center">
        We&apos;re building something great. Check back soon for early access.
      </p>
    )
  } else if (phase === 'error') {
    content = (
      <div className="flex flex-col gap-3 items-center text-center">
        <p className="text-red-500 text-sm">{error || 'Something went wrong'}</p>
        <button
          type="button"
          className="text-sm underline text-muted-foreground hover:text-foreground"
          onClick={() => retry()}
        >
          Try again
        </button>
      </div>
    )
  } else if (phase === 'onboarding') {
    content = (
      <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Joining waitlist...</p>
      </div>
    )
  } else if (phase === 'approved') {
    content = <ApprovedPanel variant="page" />
  } else if (phase === 'waiting' && status) {
    content = (
      <WaitingRoom
        status={status}
        error={error}
        onSubmitInvite={submitInviteCode}
        variant="page"
      />
    )
  } else if (phase === 'notJoined') {
    content = (
      <JoinWaitlistPanel
        isJoining={false}
        error={error}
        hasReferral={hasReferral}
        hasInvite={hasInvite}
        inviteBypassEnabled={status?.inviteBypassEnabled ?? false}
        onJoin={() => joinWaitlist()}
        onSubmitInvite={submitInviteCode}
      />
    )
  } else {
    content = null
  }

  return (
    <WaitlistCenteredLayout
      title={title}
      subtitle={subtitle}
      emoji={phase === 'waiting' ? '🎉' : phase === 'approved' ? '✅' : undefined}
    >
      {content}
    </WaitlistCenteredLayout>
  )
}

export function WaitlistPageClient() {
  return (
    <RequireAuth>
      <WaitlistDashboard />
    </RequireAuth>
  )
}
