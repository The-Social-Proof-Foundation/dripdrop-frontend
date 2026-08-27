'use client'

import { useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, Copy, Link2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LiquidGlassMaterial } from '@/components/nav/liquid-glass-capsule'
import { HoldSignOutButton } from '@/components/profile/hold-sign-out-button'
import { UserAvatar } from '@/components/profile/user-avatar'
import { useMySocialAuth } from '@/hooks/useMySocialAuth'
import { useReferralShare } from '@/hooks/useReferralShare'
import { getProfileReservationRing } from '@/lib/profile-graphql'
import { getProfilePath, truncateAddress } from '@/lib/profile-slug'
import type { MySocialProfile } from '@/lib/profile-utils'

interface ProfileDropdownProps {
  address: string
  profile: MySocialProfile | null
}

export function ProfileDropdown({ address, profile }: ProfileDropdownProps) {
  const { signOut } = useMySocialAuth()
  const { shareUrl, isLoading: referralLoading, refresh: refreshReferral } = useReferralShare(true)
  const [open, setOpen] = useState(false)
  const [addressCopied, setAddressCopied] = useState(false)
  const [referralCopied, setReferralCopied] = useState(false)

  const displayName = profile?.display_name?.trim() || 'Anonymous User'
  const username = profile?.username?.trim() || null
  const profilePath = getProfilePath(address, profile)
  const truncated = truncateAddress(address)
  const { showRing, ringPercent } = getProfileReservationRing(profile)

  const handleCopyWalletAddress = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    void navigator.clipboard.writeText(address).then(() => {
      setAddressCopied(true)
      window.setTimeout(() => setAddressCopied(false), 2000)
    })
  }

  const handleCopyReferral = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!shareUrl) return
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setReferralCopied(true)
      toast.success('Referral link copied!')
      window.setTimeout(() => setReferralCopied(false), 2000)
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      void refreshReferral()
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open profile menu"
          className="inline-flex shrink-0 items-center justify-center overflow-visible rounded-full border-0 bg-transparent p-0 outline-none ring-0 transition-transform duration-150 ease-out active:scale-[0.97] focus:outline-none focus-visible:outline-none [-webkit-tap-highlight-color:transparent]"
        >
          <UserAvatar
            imageSrc={profile?.profile_photo}
            size="sm"
            interactive
            showRing={showRing}
            ringPercent={ringPercent}
            ringPreset="navTrigger"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent asChild align="end" sideOffset={8}>
        <LiquidGlassMaterial
          shape="card"
          radius="rounded-lg"
          tintStrength="strong"
          className="z-50 w-[min(100vw-1.5rem,330px)] p-0"
        >
        <DropdownMenuItem asChild className="rounded-none p-0 focus:bg-transparent data-[highlighted]:bg-transparent">
          <Link
            href={profilePath}
            onClick={() => setOpen(false)}
            className="flex w-full cursor-pointer select-none items-center gap-3 rounded-t-lg px-3 py-2.5 outline-none hover:bg-white/10 focus:bg-white/10 dark:hover:bg-white/10"
          >
            <UserAvatar
              imageSrc={profile?.profile_photo}
              size="md"
              showRing={showRing}
              ringPercent={ringPercent}
              ringPreset="navDropdown"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-base font-medium leading-tight text-foreground">
                  {displayName}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              {username && (
                <span className="truncate text-sm leading-tight text-muted-foreground">
                  @{username}
                </span>
              )}
              <div className="flex min-w-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyWalletAddress}
                  className="inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0 outline-none"
                  aria-label="Copy wallet address"
                >
                  {addressCopied ? (
                    <Check className="h-2.5 w-2.5 text-green-500" />
                  ) : (
                    <Copy className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </button>
                <span className="truncate text-xs text-muted-foreground">
                  {truncated}
                </span>
              </div>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-0 bg-black/10 dark:bg-white/10" />

        <DropdownMenuItem
          disabled={!shareUrl || referralLoading}
          onSelect={(e) => e.preventDefault()}
          onClick={handleCopyReferral}
          className="group cursor-pointer rounded-none p-0 text-sm text-muted-foreground focus:bg-white/10 focus:text-foreground data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 dark:focus:bg-white/10"
        >
          <div className="flex w-full items-center gap-2.5 px-3 py-2.5">
            <Link2 className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              {shareUrl || referralLoading ? (
                'Copy referral link'
              ) : (
                <span className="block truncate leading-tight">
                  <span className="block">Copy referral link</span>
                  <span className="block text-xs text-muted-foreground/80">
                    Join the waitlist to get your link
                  </span>
                </span>
              )}
            </span>
            {referralCopied ? (
              <Check className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100" />
            )}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-0 bg-black/10 dark:bg-white/10" />

        <div className="overflow-hidden rounded-b-lg">
          <HoldSignOutButton
            className="flex cursor-pointer select-none items-center gap-2.5 border-none px-3 py-2.5 text-sm text-red-500/75 outline-none hover:bg-red-500/[0.08] dark:text-red-400/80 dark:hover:bg-red-400/[0.1]"
            icon={<LogOut className="h-4 w-4 shrink-0" />}
            onConfirm={() => {
              setOpen(false)
              void signOut()
            }}
          />
        </div>
        </LiquidGlassMaterial>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
