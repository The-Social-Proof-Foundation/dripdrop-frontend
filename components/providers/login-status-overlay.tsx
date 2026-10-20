'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { AdminTxOverlay } from '@/components/ui/admin-tx-overlay'
import {
  subscribeZkLoginAuthBusy,
  zkLoginAuthBusy,
  zkLoginProofRecovered,
} from '@/lib/zklogin/auth-busy'
import {
  clearLoginCelebration,
  loginCelebrationPending,
  subscribeLoginCelebration,
} from '@/lib/login-celebration'

const SUCCESS_HOLD_MS = 1400
const STEP_MS = 1800
const RECOVER_HOLD_MS = 1200
const SIGN_IN_STEPS = [
  'Signing in...',
  'Generating zero-knowledge proof...',
  'Verifying proof...',
  'Securing your session...',
] as const
const RECOVER_TEXT = 'Recovering zk-proof...'

export function LoginStatusOverlay({
  isAuthenticated,
  isAuthResolving,
}: {
  isAuthenticated: boolean
  isAuthResolving: boolean
}) {
  const pathname = usePathname()
  const celebrating = useSyncExternalStore(subscribeLoginCelebration, loginCelebrationPending, () => false)
  const zkLoginBusy = useSyncExternalStore(subscribeZkLoginAuthBusy, zkLoginAuthBusy, () => false)
  const recovered = useSyncExternalStore(subscribeZkLoginAuthBusy, zkLoginProofRecovered, () => false)
  const [recoverHeld, setRecoverHeld] = useState(false)

  useEffect(() => {
    if (!recovered) {
      setRecoverHeld(false)
      return
    }
    const timer = window.setTimeout(() => setRecoverHeld(true), RECOVER_HOLD_MS)
    return () => window.clearTimeout(timer)
  }, [recovered])

  const ready =
    celebrating &&
    isAuthenticated &&
    !zkLoginBusy &&
    !isAuthResolving &&
    pathname != null &&
    pathname !== '/auth/callback' &&
    (!recovered || recoverHeld)

  useEffect(() => {
    if (!ready) return
    const timer = window.setTimeout(() => clearLoginCelebration(), SUCCESS_HOLD_MS)
    return () => window.clearTimeout(timer)
  }, [ready])

  const [step, setStep] = useState(0)
  const cycling = celebrating && !ready && !recovered

  useEffect(() => {
    if (!cycling) {
      setStep(0)
      return
    }
    const timer = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, SIGN_IN_STEPS.length - 1))
    }, STEP_MS)
    return () => window.clearInterval(timer)
  }, [cycling])

  if (!celebrating) return null

  return (
    <AdminTxOverlay
      fullscreen
      phase={ready ? 'success' : 'processing'}
      processingText={recovered ? RECOVER_TEXT : SIGN_IN_STEPS[step]}
      successText="Signed in"
    />
  )
}
