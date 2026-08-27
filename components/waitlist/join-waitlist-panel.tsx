'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InviteCodePanel } from '@/components/waitlist/invite-code-panel'

interface JoinWaitlistPanelProps {
  isJoining?: boolean
  error?: string | null
  hasReferral?: boolean
  hasInvite?: boolean
  inviteBypassEnabled?: boolean
  onJoin: () => void
  onSubmitInvite?: (code: string) => Promise<void>
}

const linkClass =
  'text-xs text-muted-foreground hover:text-foreground transition-colors'

export function JoinWaitlistPanel({
  isJoining,
  error,
  hasReferral,
  hasInvite,
  inviteBypassEnabled,
  onJoin,
  onSubmitInvite,
}: JoinWaitlistPanelProps) {
  const [showInviteCode, setShowInviteCode] = useState(false)
  const canRedeemInvite = inviteBypassEnabled && !!onSubmitInvite

  const caption =
    hasInvite
      ? 'You have an invite link. Join to redeem it.'
      : hasReferral
        ? 'You were referred. Join to boost their spot in the waitlist.'
        : 'Reserve your spot for early TestFlight access to DripDrop.'

  return (
    <div className="flex w-full flex-col gap-4 text-center">
      {!showInviteCode ? (
        <>
          <Button
            type="button"
            size="lg"
            disabled={isJoining}
            className="h-12 w-full rounded-full font-semibold font-sans"
            onClick={() => onJoin()}
          >
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join waitlist'
            )}
          </Button>

          <p className="text-xs text-muted-foreground">{caption}</p>

          <div className="flex flex-row items-center justify-center gap-4">
            {canRedeemInvite && (
              <button
                type="button"
                className={linkClass}
                onClick={() => setShowInviteCode(true)}
              >
                Have an invite code?
              </button>
            )}
            <Link href="/creators" className={linkClass}>
              Apply as a creator
            </Link>
          </div>
        </>
      ) : (
        canRedeemInvite && (
          <>
            <InviteCodePanel onSubmit={onSubmitInvite} error={error} />
            <button
              type="button"
              className={linkClass}
              onClick={() => setShowInviteCode(false)}
            >
              Back
            </button>
          </>
        )
      )}

      {error && !inviteBypassEnabled && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
