'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { consumeAuthReturnTo } from '@/lib/mysocial-auth-config'
import { clearLoginCelebration } from '@/lib/login-celebration'
import { completeZkLoginRedirect } from '@/lib/zklogin/login'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function handleCallback() {
      try {
        await completeZkLoginRedirect()
        if (!cancelled) router.replace(consumeAuthReturnTo())
      } catch (err) {
        clearLoginCelebration()
        const message =
          err instanceof Error && err.message ? err.message : 'Authentication failed. Please try again.'
        sessionStorage.setItem('waitlist_auth_error', message)
        if (!cancelled) router.replace('/login')
      }
    }

    void handleCallback()
    return () => {
      cancelled = true
    }
  }, [router])

  return <div className="min-h-screen" />
}
