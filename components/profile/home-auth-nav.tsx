'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { NavAppStoreBadge } from '@/components/nav/nav-app-store-badge'
import { useMySocialAuth } from '@/hooks/useMySocialAuth'
import { useWaitlistStatus } from '@/hooks/useWaitlistStatus'
import { ProfileDropdown } from '@/components/profile/profile-dropdown'
import { useReferralHref } from '@/hooks/useReferralHref'

export function HomeAuthNav() {
  const loginHref = useReferralHref('/login?next=/waitlist')
  const {
    session,
    isAuthenticated,
    isLoading: authLoading,
    profile,
  } = useMySocialAuth()
  const address = session?.user.address ?? null
  const { isApproved, isLoading: waitlistLoading } = useWaitlistStatus(isAuthenticated && !!address)

  if (authLoading) {
    return null
  }

  if (!isAuthenticated || !address) {
    return (
      <Button
        asChild
        size="sm"
        className="h-9 shrink-0 rounded-full px-4 text-xs font-semibold font-sans bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
      >
        <Link href={loginHref}>Early access</Link>
      </Button>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-3 sm:gap-4">
      {!waitlistLoading && isApproved && <NavAppStoreBadge />}
      <ProfileDropdown address={address} profile={profile} />
    </div>
  )
}
