'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { LoginPanel } from '@/components/waitlist/login-panel'
import { WaitlistSplitLayout } from '@/components/waitlist/waitlist-split-layout'
import { useMySocialAuth } from '@/hooks/useMySocialAuth'
import { getVideoDurationLabel } from '@/lib/video-config'
import { storeAuthReturnTo, type MySocialProvider } from '@/lib/mysocial-auth-config'

export function LoginPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authError, setAuthError] = useState<string | null>(null)
  const { isAuthenticated, isLoading, signIn } = useMySocialAuth()

  const nextPath = searchParams.get('next') || '/waitlist'
  const safeNextPath =
    nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/waitlist'

  useEffect(() => {
    storeAuthReturnTo(safeNextPath)
  }, [safeNextPath])

  useEffect(() => {
    const err = sessionStorage.getItem('waitlist_auth_error')
    if (err) {
      setAuthError(err)
      sessionStorage.removeItem('waitlist_auth_error')
    }
  }, [])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(safeNextPath)
    }
  }, [isAuthenticated, isLoading, safeNextPath, router])

  const handleSignIn = (provider: MySocialProvider) => {
    signIn(provider, safeNextPath)
  }

  if (isLoading || isAuthenticated) {
    return (
      <WaitlistSplitLayout
        title="Sign in"
        subtitle={`Continue with Google or Apple to access DripDrop early access.`}
      >
        <div className="flex flex-col items-center justify-center gap-2 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </WaitlistSplitLayout>
    )
  }

  return (
    <WaitlistSplitLayout
      title="Sign in"
      subtitle={`Continue with Google or Apple to access the ${getVideoDurationLabel()} video economy.`}
    >
      <LoginPanel error={authError} onSignIn={handleSignIn} variant="page" />
    </WaitlistSplitLayout>
  )
}
