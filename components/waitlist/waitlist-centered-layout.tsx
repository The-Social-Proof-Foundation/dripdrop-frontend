'use client'

import { ThemeLogo } from '@/components/theme-logo'

interface WaitlistCenteredLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  showLogo?: boolean
  emoji?: string
}

export function WaitlistCenteredLayout({
  children,
  title,
  subtitle,
  showLogo = true,
  emoji,
}: WaitlistCenteredLayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 pt-24 pb-16 sm:px-10">
      <header className="mb-8 sm:mb-10 flex flex-col items-center text-center max-w-md">
        {emoji ? (
          <span className="mb-6 text-5xl sm:text-6xl leading-none" role="img" aria-hidden>
            {emoji}
          </span>
        ) : (
          showLogo && (
            <ThemeLogo type="silhouette" size={48} className="mb-6" alt="DripDrop" />
          )
        )}
        <h1 className="font-sans font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
      </header>

      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
