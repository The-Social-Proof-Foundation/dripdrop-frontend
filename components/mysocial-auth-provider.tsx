'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import type { MySocialProvider } from '@/lib/mysocial-auth-config'
import { MYSOCIAL_AUTH_CHANGED_EVENT } from '@/lib/mysocial-auth-events'
import {
  getValidSession,
  loadStoredSession,
  signOutSession,
  type MySocialSession,
} from '@/lib/mysocial-session'
import { startZkLoginRedirect } from '@/lib/zklogin/login'
import { LoginStatusOverlay } from '@/components/providers/login-status-overlay'
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
}

const MySocialAuthContext = createContext<MySocialAuthContextValue | null>(null)

export function MySocialAuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [session, setSession] = useState<MySocialSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const syncId = useRef(0)

  const syncSession = useCallback(async () => {
    const id = ++syncId.current
    let next: MySocialSession | null
    try {
      next = await getValidSession()
    } catch {
      // Refresh failed without revoking the session; keep what is stored and retry on the next sync.
      next = loadStoredSession()
    }
    if (id !== syncId.current) return
    setSession(next)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void syncSession()
  }, [syncSession, pathname])

  useEffect(() => {
    const handleAuthChanged = () => void syncSession()
    window.addEventListener(MYSOCIAL_AUTH_CHANGED_EVENT, handleAuthChanged)
    return () => window.removeEventListener(MYSOCIAL_AUTH_CHANGED_EVENT, handleAuthChanged)
  }, [syncSession])

  const signIn = useCallback(async (provider: MySocialProvider, returnTo?: string) => {
    await startZkLoginRedirect(provider, returnTo)
  }, [])

  const signOut = useCallback(async () => {
    await signOutSession()
    setSession(null)
    window.location.href = '/'
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
    ],
  )

  return (
    <MySocialAuthContext.Provider value={value}>
      {children}
      <LoginStatusOverlay isAuthenticated={!!session} isAuthResolving={isLoading} />
    </MySocialAuthContext.Provider>
  )
}

export function useMySocialAuthContext(): MySocialAuthContextValue {
  const context = useContext(MySocialAuthContext)
  if (!context) {
    throw new Error('useMySocialAuth must be used within MySocialAuthProvider')
  }
  return context
}
