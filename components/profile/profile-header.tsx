'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, type MouseEvent } from 'react'
import { Check, Copy, Link2, Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMySocialAuth } from '@/hooks/useMySocialAuth'
import { useReferralShare } from '@/hooks/useReferralShare'
import type { WaitlistUserStatus } from '@/lib/waitlist-types'
import { abbreviateAddress, addressesMatch, usernamesMatch } from '@/lib/profile-slug'
import { getDefaultAvatarFromDocument } from '@/lib/default-avatar'
import { getCoverPhoto, type MySocialProfile } from '@/lib/profile-utils'
import { getProfileReservationRing } from '@/lib/profile-graphql'
import { DefaultAvatarImage } from '@/components/profile/default-avatar-image'
import { ProfileHeroAvatarRing } from '@/components/profile/profile-hero-avatar-ring'
import { InviteSharePanel } from '@/components/waitlist/invite-share-panel'
import { ProfileHint } from '@/components/waitlist/profile-hint'

interface ProfileHeaderProps {
  profile: MySocialProfile | null
  walletAddress: string
  isOwnProfile: boolean
  isLoading?: boolean
}

function ProfileStat({
  label,
  value,
  loading,
}: {
  label: string
  value: number
  loading?: boolean
}) {
  return (
    <div className="flex w-20 flex-col items-center gap-2 px-2 py-1 text-center">
      <div className="text-base font-semibold tabular-nums leading-none">
        {loading ? '0' : value}
      </div>
      <div className="text-[11px] leading-tight text-muted-foreground">{label}</div>
    </div>
  )
}

function normalizeWebsiteHref(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

function websiteDisplayLabel(raw: string): string {
  try {
    const url = new URL(normalizeWebsiteHref(raw))
    const host = url.hostname.replace(/^www\./i, '')
    const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '')
    return `${host}${path}`
  } catch {
    return raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '')
  }
}

function ProfileAboutLinks({ profile }: { profile: MySocialProfile | null }) {
  const location = profile?.current_location?.trim() || ''
  const websiteRaw = profile?.website?.trim() || ''
  const websiteHref = websiteRaw ? normalizeWebsiteHref(websiteRaw) : ''
  const websiteLabel = websiteRaw ? websiteDisplayLabel(websiteRaw) : ''

  if (!location && !websiteHref) return null

  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center gap-1 sm:flex-row sm:flex-wrap sm:gap-x-3 sm:gap-y-1">
      {location ? (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-1 text-sm text-muted-foreground hover:underline"
          title={`Open ${location} in Google Maps`}
        >
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{location}</span>
        </a>
      ) : null}

      {websiteHref ? (
        <a
          href={websiteHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-1 text-sm text-sky-500 hover:underline"
          title={websiteHref}
        >
          <Link2 className="h-3.5 w-3.5 shrink-0 -rotate-45" aria-hidden />
          <span className="truncate">{websiteLabel}</span>
        </a>
      ) : null}
    </div>
  )
}

function ReferralLinkCard({
  shareUrl,
  isLoading,
  description = 'Share your link — friends who join move you up the waitlist.',
}: {
  shareUrl: string | null
  isLoading?: boolean
  description?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!shareUrl) {
    return null
  }

  return (
    <div className="w-full rounded-xl border border-border bg-card px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-xs font-medium text-foreground">Share your referral link</p>
      </div>
      <p className="mb-2.5 text-xs text-muted-foreground">{description}</p>
      <div className="flex gap-2">
        <Input readOnly value={shareUrl} className="h-9 bg-background/80 text-xs" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

function ApprovedProfileSection({
  profile,
  profileLoading,
  shareUrl,
  shareLoading,
}: {
  profile: MySocialProfile | null
  profileLoading?: boolean
  shareUrl: string | null
  shareLoading?: boolean
}) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <InviteSharePanel />

      <ReferralLinkCard
        shareUrl={shareUrl}
        isLoading={shareLoading}
        description="Share your link with friends on DripDrop."
      />

      <ProfileHint profile={profile} isLoading={profileLoading} />
    </div>
  )
}

function ReferralShareBanner({
  shareUrl,
  isLoading,
  positionEstimate,
  waitlistStatus,
}: {
  shareUrl: string | null
  isLoading: boolean
  positionEstimate: number | null
  waitlistStatus: WaitlistUserStatus | null
}) {
  const [copied, setCopied] = useState(false)
  const isOnWaitlist =
    waitlistStatus === 'waiting' || waitlistStatus === 'approved'
  const showWaitlistPosition =
    waitlistStatus === 'waiting' && positionEstimate != null

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex w-full max-w-md items-center justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (waitlistStatus === 'approved') {
    return null
  }

  if (!isOnWaitlist) {
    return (
      <Button
        asChild
        size="lg"
        className="h-12 px-8 rounded-full text-base font-semibold font-sans bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
      >
        <Link href="/waitlist">Join the Waitlist</Link>
      </Button>
    )
  }

  if (!shareUrl) {
    return (
      <div className="flex w-full max-w-md items-center justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card px-4 py-3">
      {showWaitlistPosition && (
        <>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Estimated waitlist position</span>
            <span className="font-semibold tabular-nums text-foreground">
              #{positionEstimate.toLocaleString()}
            </span>
          </div>
          <div className="-mx-4 my-3 border-t border-border/60" />
        </>
      )}

      <div className="mb-2 flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-xs font-medium text-foreground">
          Share your referral link
        </p>
      </div>
      <p className="mb-2.5 text-xs text-muted-foreground">
        Share your link to move up the waitlist
      </p>
      <div className="flex gap-2">
        <Input
          readOnly
          value={shareUrl}
          className="h-9 bg-background/80 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export function ProfileHeader({
  profile,
  walletAddress,
  isOwnProfile,
  isLoading = false,
}: ProfileHeaderProps) {
  const [addressCopied, setAddressCopied] = useState(false)
  const { session, profile: authProfile, isAuthenticated } = useMySocialAuth()
  const sessionAddress = session?.user.address ?? null
  const viewingOwnProfile =
    isOwnProfile ||
    (isAuthenticated &&
      !!sessionAddress &&
      (addressesMatch(sessionAddress, walletAddress) ||
        addressesMatch(sessionAddress, profile?.owner_address) ||
        usernamesMatch(profile?.username, authProfile?.username)))

  const {
    shareUrl,
    positionEstimate,
    waitlistStatus,
    isLoading: waitlistLoading,
  } = useReferralShare(viewingOwnProfile)

  const displayName = profile?.display_name?.trim() || 'Anonymous User'
  const username = profile?.username?.trim() || null
  const coverSrc = getCoverPhoto(profile)
  const profilePhoto = profile?.profile_photo?.trim() || null
  const { showRing, ringPercent } = getProfileReservationRing(profile)

  const handleCopyAddress = (e: MouseEvent) => {
    e.preventDefault()
    void navigator.clipboard.writeText(walletAddress).then(() => {
      setAddressCopied(true)
      window.setTimeout(() => setAddressCopied(false), 2000)
    })
  }

  return (
    <div className="relative">
      {/* Cover photo — wide banner with inset padding */}
      <div className="p-[12px]">
        <div className="relative mx-auto h-[280px] w-full max-w-4xl overflow-hidden rounded-2xl bg-zinc-800 sm:h-[320px] sm:rounded-3xl">
          <Image
            src={coverSrc}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/default-cover.webp'
            }}
          />
        </div>
      </div>

      {/* Profile body — overlaps cover */}
      <div
        className="relative mx-auto max-w-2xl px-4 pb-8"
        style={{ marginTop: '-88px' }}
      >
        <div className="flex flex-col items-center pt-8 pb-4">
          <div className="flex flex-col items-center space-y-2">
            {/* Avatar */}
            <ProfileHeroAvatarRing showRing={showRing} ringPercent={ringPercent}>
              {profilePhoto ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={profilePhoto}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = getDefaultAvatarFromDocument()
                  }}
                />
              ) : (
                <DefaultAvatarImage />
              )}
            </ProfileHeroAvatarRing>

            {/* Name */}
            <h1 className="text-center text-xl font-semibold tracking-tight sm:text-2xl">
              {isLoading ? (
                <span className="inline-block h-7 w-40 animate-pulse rounded-md bg-muted" />
              ) : (
                displayName
              )}
            </h1>

            {username && (
              <p className="text-xs text-muted-foreground">@{username}</p>
            )}

            {/* Abbreviated wallet address */}
            {!isLoading && walletAddress && (
              <button
                type="button"
                onClick={handleCopyAddress}
                className="group flex max-w-full items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {addressCopied ? (
                  <Check className="h-3 w-3 shrink-0 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 shrink-0 transition-colors group-hover:text-foreground" />
                )}
                <span className="truncate font-mono">
                  {abbreviateAddress(walletAddress, 10, 10)}
                </span>
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mt-8 flex justify-center gap-1">
            <ProfileStat
              label="Posts"
              value={profile?.post_count ?? 0}
              loading={isLoading}
            />
            <ProfileStat
              label="Followers"
              value={profile?.followers_count ?? 0}
              loading={isLoading}
            />
            <ProfileStat
              label="Following"
              value={profile?.following_count ?? 0}
              loading={isLoading}
            />
          </div>

          <div className="flex w-full max-w-md flex-col items-center gap-3.5 py-4">
            {profile?.bio?.trim() && (
              <p className="text-center text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {profile.bio}
              </p>
            )}
            <ProfileAboutLinks profile={profile} />
          </div>

          {viewingOwnProfile && (
            <ApprovedProfileSection
              profile={profile}
              profileLoading={isLoading}
              shareUrl={shareUrl}
              shareLoading={waitlistLoading}
            />
          )}

          {viewingOwnProfile && waitlistStatus && waitlistStatus !== 'approved' && (
            <ReferralShareBanner
              shareUrl={shareUrl}
              isLoading={waitlistLoading}
              positionEstimate={positionEstimate}
              waitlistStatus={waitlistStatus}
            />
          )}
        </div>
      </div>
    </div>
  )
}
