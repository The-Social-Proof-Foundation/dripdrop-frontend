'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  captureReferralParamsFromSearch,
  clearReferralParams as clearStoredReferralParams,
  getStoredInviteCode,
  getStoredReferralCode,
} from '@/lib/referral-storage'

export function useReferralParams() {
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      captureReferralParamsFromSearch(window.location.search)
    }
    setReferralCode(getStoredReferralCode())
    setInviteCode(getStoredInviteCode())
  }, [])

  const hasReferral = useMemo(() => !!referralCode, [referralCode])
  const hasInvite = useMemo(() => !!inviteCode, [inviteCode])

  return { referralCode, inviteCode, hasReferral, hasInvite }
}

export { clearStoredReferralParams as clearReferralParams }
