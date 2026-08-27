'use client'

import { useState } from 'react'
import { Check, Copy, Loader2, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { InviteCode } from '@/lib/waitlist-types'
import { truncateAddress } from '@/lib/profile-slug'
import { useInviteCodes } from '@/hooks/useInviteCodes'
import { toast } from 'sonner'

function formatExpiry(iso: string | null): string {
  if (!iso) return 'No expiry'
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return 'Unknown'
  }
}

function InviteCodeRow({ invite }: { invite: InviteCode }) {
  const [copied, setCopied] = useState(false)
  const isClaimed = invite.status === 'accepted'
  const isExpired =
    invite.status === 'expired' ||
    (invite.status === 'pending' &&
      invite.expiresAt &&
      new Date(invite.expiresAt).getTime() <= Date.now())
  const isPending = invite.status === 'pending' && !isExpired

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(invite.inviteCode)
    setCopied(true)
    toast.success('Invite code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyAddress = async () => {
    if (!invite.inviteeWallet) return
    await navigator.clipboard.writeText(invite.inviteeWallet)
    setCopied(true)
    toast.success('Wallet address copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 dark:bg-background/40">
      <p
        className={`min-w-0 shrink-0 font-mono text-sm font-medium tracking-wide ${
          isClaimed ? 'text-muted-foreground line-through' : ''
        }`}
      >
        {invite.inviteCode}
      </p>

      <div className="ml-auto flex min-w-0 items-center gap-1">
        {isClaimed ? (
          <>
            <Check className="h-3.5 w-3.5 shrink-0 text-green-500" aria-hidden />
            <span className="min-w-0 shrink font-mono text-[11px] leading-tight text-muted-foreground">
              {invite.inviteeWallet
                ? truncateAddress(invite.inviteeWallet)
                : 'Claimed'}
            </span>
            {invite.inviteeWallet && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="Copy wallet address"
                onClick={handleCopyAddress}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </>
        ) : (
          <>
            <span className="min-w-[5.5rem] shrink-0 text-right text-[11px] leading-tight text-muted-foreground">
              {isExpired ? 'Expired' : `Expires ${formatExpiry(invite.expiresAt)}`}
            </span>
            {isPending && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="Copy invite code"
                onClick={handleCopyCode}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function InviteSharePanel() {
  const { invites, activeCount, maxInvites, canManage, isLoading, error } = useInviteCodes(true)

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canManage) {
    return null
  }

  const displayInvites = invites.filter(
    (i) =>
      i.status === 'accepted' ||
      (i.status === 'pending' &&
        (!i.expiresAt || new Date(i.expiresAt).getTime() > Date.now())),
  )

  if (displayInvites.length === 0) {
    if (!canManage) {
      return null
    }

    return (
      <div className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Ticket className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Share early access</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Your invite codes will show up here once they&apos;re assigned.
        </p>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center">
      <div className="mb-2 flex items-center justify-center gap-2">
        <Ticket className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Share early access</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Give friends a code to skip the waitlist ({activeCount}/{maxInvites} active)
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {displayInvites.map((invite) => (
          <InviteCodeRow key={invite.inviteId} invite={invite} />
        ))}
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
