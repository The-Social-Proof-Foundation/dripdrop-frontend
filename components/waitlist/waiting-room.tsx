'use client'

import Link from 'next/link'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { WaitlistStatus } from '@/lib/waitlist-types'
import { InviteCodePanel } from '@/components/waitlist/invite-code-panel'
import { toast } from 'sonner'
import { useState } from 'react'

interface WaitingRoomProps {
  status: WaitlistStatus
  error?: string | null
  onSubmitInvite: (code: string) => Promise<void>
  variant?: 'inline' | 'page'
}

export function WaitingRoom({
  status,
  error,
  onSubmitInvite,
  variant = 'inline',
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false)

  const position = status.positionEstimate
  const shareUrl = status.shareUrl
  const isPage = variant === 'page'

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInviteSubmit = async (code: string) => {
    await onSubmitInvite(code)
    toast.success('Invite accepted!')
  }

  return (
    <div
      className={`flex flex-col gap-5 w-full ${
        isPage ? 'text-center items-center' : 'max-w-md mx-auto text-center'
      }`}
    >
      <div>
        <p className="text-lg font-semibold font-sans text-foreground">You&apos;re on the waitlist</p>
        {position != null && (
          <p className="text-3xl font-bold font-sans mt-2 text-foreground">
            #{position.toLocaleString()}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-1">estimated position</p>
      </div>

      {shareUrl && (
        <div className="flex flex-col gap-2 w-full">
          <p className="text-xs text-muted-foreground">Share your link to move up the waitlist</p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={shareUrl}
              className="text-xs bg-background/80"
            />
            <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {status.inviteBypassEnabled && (
        <InviteCodePanel onSubmit={handleInviteSubmit} error={error} />
      )}

      {isPage && (
        <Link
          href="/creators"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Apply as a creator
        </Link>
      )}

      {error && !status.inviteBypassEnabled && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  )
}
