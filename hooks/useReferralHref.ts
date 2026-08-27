'use client'

import { useEffect, useState } from 'react'
import { appendReferralParamsToHref } from '@/lib/referral-storage'

/** Append stored referral params after mount to avoid SSR/client hydration mismatches. */
export function useReferralHref(href: string): string {
  const [resolved, setResolved] = useState(href)

  useEffect(() => {
    setResolved(appendReferralParamsToHref(href))
  }, [href])

  return resolved
}
