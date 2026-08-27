'use client'

import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import type { MySocialProvider } from '@/lib/mysocial-auth-config'

interface LoginPanelProps {
  isLoading?: boolean
  error?: string | null
  onSignIn: (provider: MySocialProvider) => void
  /** Tighter layout for the dedicated /waitlist page (header lives in split layout). */
  variant?: 'inline' | 'page'
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

export function LoginPanel({ isLoading, error, onSignIn, variant = 'inline' }: LoginPanelProps) {
  const isPage = variant === 'page'
  const ssoButtonClass =
    'h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-300/80 bg-zinc-50 px-4 text-sm font-medium dark:bg-zinc-100 text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white dark:hover:text-zinc-900 shadow-sm'

  return (
    <div className={`flex flex-col gap-4 w-full ${isPage ? '' : 'max-w-md mx-auto'}`}>
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="ghost"
          size="default"
          disabled={isLoading}
          className={isPage ? ssoButtonClass : `${ssoButtonClass} backdrop-blur-sm`}
          onClick={() => onSignIn('google')}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Image src="/google.svg" alt="" width={16} height={16} className="mr-2" />
          )}
          Continue with Google
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="default"
          disabled={isLoading}
          className={isPage ? ssoButtonClass : `${ssoButtonClass} backdrop-blur-sm`}
          onClick={() => onSignIn('apple')}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <span className="mr-2"><AppleIcon /></span>
          )}
          Continue with Apple
        </Button>
      </div>

      {!isPage && (
        <p className="text-xs text-muted-foreground/75 text-center">
          Sign in to join the early access waitlist
        </p>
      )}

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  )
}
