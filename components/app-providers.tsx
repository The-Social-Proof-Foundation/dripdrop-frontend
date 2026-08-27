'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { MySocialAuthProvider } from '@/components/mysocial-auth-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { SiteNav } from '@/components/nav/site-nav'
import { Footer } from '@/components/footer'
import { Toaster } from '@/components/ui/sonner'
import { CookieConsent } from '@/components/cookie-consent'
import ThemeFavicon from '@/components/theme-favicon'
import GoogleAnalytics from '@/lib/googleAnalytics'
import { ReferralCapture } from '@/components/referral-capture'
import { NetworkProvider } from '@/lib/network-context'
import { usePathname } from 'next/navigation'

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNav = pathname !== '/login'
  const showFooter = pathname !== '/login' && pathname !== '/'

  return (
    <>
      {showNav && <SiteNav />}
      {children}
      {showFooter && <Footer />}
      <Toaster />
      <CookieConsent />
      <ThemeFavicon />
      <GoogleAnalytics />
    </>
  )
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
    >
      <QueryProvider>
        <NetworkProvider>
          <MySocialAuthProvider>
            <ReferralCapture />
            <AppShell>{children}</AppShell>
          </MySocialAuthProvider>
        </NetworkProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
