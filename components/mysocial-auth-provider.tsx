'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import type { MySocialProvider } from '@/lib/mysocial-auth-config'
import { MYSOCIAL_AUTH_CHANGED_EVENT } from '@/lib/mysocial-auth-events'
import { startSignIn, type MySocialSession } from '@/lib/mysocial-auth-client'
import {
  clearSession,
  loadStoredSession,
  saveSession,
  signOutSession,
} from '@/lib/mysocial-session'
import { useMySocialProfile } from '@/hooks/useMySocialProfile'
import type { MySocialProfile } from '@/lib/profile-utils'

interface MySocialAuthContextValue {
  session: MySocialSession | null
  isAuthenticated: boolean
  isLoading: boolean
  profile: MySocialProfile | null
  hasProfile: boolean
  isLoadingProfile: boolean
  needsProfileCreation: boolean
  refreshProfile: () => void
  signIn: (provider: MySocialProvider, returnTo?: string) => Promise<void>
  signOut: () => Promise<void>
  setAuthenticatedSession: (next: MySocialSession) => void
  clearLocalSession: () => void
}

const MySocialAuthContext = createContext<MySocialAuthContextValue | null>(null)

export function MySocialAuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [session, setSession] = useState<MySocialSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const syncSession = useCallback(() => {
    setSession(loadStoredSession())
    setIsLoading(false)
  }, [])

  useEffect(() => {
    syncSession()
  }, [syncSession, pathname])

  useEffect(() => {
    const handleAuthChanged = () => syncSession()
    window.addEventListener(MYSOCIAL_AUTH_CHANGED_EVENT, handleAuthChanged)
    return () => window.removeEventListener(MYSOCIAL_AUTH_CHANGED_EVENT, handleAuthChanged)
  }, [syncSession])

  const signIn = useCallback(async (provider: MySocialProvider, returnTo?: string) => {
    await startSignIn(provider, returnTo)
  }, [])

  const signOut = useCallback(async () => {
    const current = session ?? loadStoredSession()
    await signOutSession(current)
    setSession(null)
    window.location.href = '/'
  }, [session])

  const setAuthenticatedSession = useCallback((next: MySocialSession) => {
    saveSession(next)
    setSession(next)
  }, [])

  const clearLocalSession = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  const address = session?.user.address ?? null
  const { profile, hasProfile, isLoading: isLoadingProfile, needsProfileCreation, refetch } =
    useMySocialProfile(address)

  const refreshProfile = useCallback(() => {
    void refetch()
  }, [refetch])

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: !!session,
      isLoading,
      profile,
      hasProfile,
      isLoadingProfile,
      needsProfileCreation,
      refreshProfile,
      signIn,
      signOut,
      setAuthenticatedSession,
      clearLocalSession,
    }),
    [
      session,
      isLoading,
      profile,
      hasProfile,
      isLoadingProfile,
      needsProfileCreation,
      refreshProfile,
      signIn,
      signOut,
      setAuthenticatedSession,
      clearLocalSession,
    ],
  )

  return (
    <MySocialAuthContext.Provider value={value}>{children}</MySocialAuthContext.Provider>
  )
}

export function useMySocialAuthContext(): MySocialAuthContextValue {
  const context = useContext(MySocialAuthContext)
  if (!context) {
    throw new Error('useMySocialAuth must be used within MySocialAuthProvider')
  }
  return context
}
