'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useMySocialAuth } from '@/hooks/useMySocialAuth'

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useMySocialAuth()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      const next = encodeURIComponent(pathname || '/waitlist')
      router.replace(`/login?next=${next}`)
    }
  }, [isAuthenticated, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
