'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileHeader } from '@/components/profile/profile-header'
import { useMySocialAuth } from '@/hooks/useMySocialAuth'
import { addressesMatch, getProfilePath, isWalletSlug, usernamesMatch } from '@/lib/profile-slug'
import { resolveProfileFromSlug, type MySocialProfile } from '@/lib/profile-utils'

interface ProfilePageClientProps {
  profileSlug: string
}

export function ProfilePageClient({ profileSlug }: ProfilePageClientProps) {
  const { session, profile: authProfile, isLoading: isAuthLoading } = useMySocialAuth()
  const connectedAddress = session?.user.address ?? null
  const [profile, setProfile] = useState<MySocialProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (isAuthLoading) return

    let cancelled = false
    setIsLoading(true)
    setNotFound(false)

    const ownUsernameMatch = usernamesMatch(profileSlug.replace(/^@/, ''), authProfile?.username)
    if (ownUsernameMatch && authProfile) {
      setProfile(authProfile)
      setIsLoading(false)
      return
    }

    void resolveProfileFromSlug(profileSlug).then((data) => {
      if (cancelled) return

      if (data) {
        setProfile(data)
        setIsLoading(false)
        return
      }

      if (ownUsernameMatch && connectedAddress) {
        setProfile(authProfile)
        setIsLoading(false)
        return
      }

      if (isWalletSlug(profileSlug)) {
        setProfile(null)
        setIsLoading(false)
        return
      }

      setNotFound(true)
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [profileSlug, connectedAddress, isAuthLoading, authProfile])

  const resolvedAddress =
    profile?.owner_address ?? (isWalletSlug(profileSlug) ? profileSlug : null)
  const isOwnProfile =
    !!connectedAddress &&
    (addressesMatch(connectedAddress, resolvedAddress) ||
      addressesMatch(connectedAddress, profileSlug) ||
      usernamesMatch(profileSlug, profile?.username) ||
      usernamesMatch(profileSlug, authProfile?.username) ||
      usernamesMatch(profile?.username, authProfile?.username) ||
      profileSlug === getProfilePath(connectedAddress, profile).slice(1))
  const walletAddress = resolvedAddress ?? connectedAddress ?? ''

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <ProfileHeader
          profile={null}
          walletAddress={walletAddress}
          isOwnProfile={isOwnProfile}
          isLoading
        />
      </main>
    )
  }

  if (notFound || !walletAddress) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4 pt-20">
        <h1 className="text-xl font-semibold text-foreground">Profile not found</h1>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          This profile does not exist or has not been set up yet.
        </p>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back home
          </Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-12">
      <ProfileHeader
          profile={profile}
          walletAddress={walletAddress}
          isOwnProfile={isOwnProfile}
        />
    </main>
  )
}
