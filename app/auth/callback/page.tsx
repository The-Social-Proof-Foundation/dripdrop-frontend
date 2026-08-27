'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import {
  getExpectedAuthPending,
  consumeAuthPending,
  consumeAuthReturnTo,
} from '@/lib/mysocial-auth-config'
import { parseAuthCallback, MySocialAuthError } from '@/lib/mysocial-auth-client'
import { saveSession } from '@/lib/mysocial-session'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      try {
        const pending = getExpectedAuthPending()
        if (!pending) {
          throw new MySocialAuthError('Authentication session expired. Please try again.')
        }

        const session = parseAuthCallback(
          window.location.href,
          pending.state,
          pending.nonce
        )
        consumeAuthPending()
        saveSession(session)

        const returnTo = consumeAuthReturnTo()
        router.replace(returnTo)
      } catch (err) {
        consumeAuthPending()
        const message =
          err instanceof MySocialAuthError
            ? err.message
            : 'Authentication failed. Please try again.'
        setError(message)
        sessionStorage.setItem('waitlist_auth_error', message)
        router.replace('/login')
      }
    }

    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Signing you in...</p>
    </div>
  )
}
