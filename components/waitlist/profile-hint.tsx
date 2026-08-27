'use client'

import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMySocialWebUrl } from '@/lib/mysocial-auth-config'
import type { MySocialProfile } from '@/lib/profile-utils'

interface ProfileHintProps {
  profile: MySocialProfile | null
  isLoading?: boolean
}

export function ProfileHint({ profile, isLoading }: ProfileHintProps) {
  if (isLoading) return null

  if (profile?.username || profile?.display_name) {
    return null
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3 rounded-lg border border-border bg-card p-4 text-center">
      <p className="text-sm font-medium text-foreground">
        Set up your profile and claim your username.
      </p>
      <p className="text-xs text-muted-foreground">
        Set a username and profile photo on MySocial (optional), but helps when you share your referral link.
      </p>
      <Button
        asChild
        size="sm"
        className="mx-auto h-9 w-auto rounded-full px-5 text-xs font-semibold font-sans bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
      >
        <a href={getMySocialWebUrl()} target="_blank" rel="noopener noreferrer">
          <User className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Set up profile
        </a>
      </Button>
    </div>
  )
}
