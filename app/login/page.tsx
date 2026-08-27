import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { LoginPageClient } from '@/components/waitlist/login-page-client'

export const metadata: Metadata = {
  title: 'Sign in — DripDrop',
  description: 'Sign in with Google or Apple to access DripDrop early access.',
}

function LoginFallback() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageClient />
    </Suspense>
  )
}
