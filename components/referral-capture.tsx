'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { captureReferralParamsFromSearch } from '@/lib/referral-storage'

function ReferralCaptureInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const search = searchParams.toString()
    captureReferralParamsFromSearch(search ? `?${search}` : window.location.search)
  }, [pathname, searchParams])

  return null
}

export function ReferralCapture() {
  return (
    <Suspense fallback={null}>
      <ReferralCaptureInner />
    </Suspense>
  )
}
