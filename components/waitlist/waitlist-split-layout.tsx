'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ThemeLogo } from '@/components/theme-logo'
import { cn } from '@/lib/utils'

interface WaitlistSplitLayoutProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  showLogo?: boolean
  showBack?: boolean
}

export function WaitlistSplitLayout({
  children,
  className,
  title = 'Join the waitlist',
  subtitle = 'Reserve early access to DripDrop.',
  showLogo = true,
  showBack = true,
}: WaitlistSplitLayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-background">
      <div
        className={cn(
          'relative w-full lg:w-2/3 shrink-0',
          'h-[38vh] min-h-[220px] sm:h-[42vh] lg:h-auto lg:min-h-[100dvh]',
        )}
        aria-hidden
      >
        <div className="absolute inset-0 bg-muted">
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-background/40" />
          <div className="absolute inset-0 flex items-end lg:items-center justify-center p-8 lg:p-16">
            <p className="font-sans text-sm sm:text-base text-muted-foreground/60 text-center lg:text-left lg:max-w-md">
              Media placeholder — add your hero image here
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex flex-col w-full lg:w-1/3 lg:min-h-[100dvh]',
          'border-t lg:border-t-0 lg:border-l border-border',
          className,
        )}
      >
        {showBack && (
          <div className="px-6 pt-5 sm:px-10 sm:pt-6 lg:px-12 lg:pt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              Back
            </Link>
          </div>
        )}

        <div className="flex flex-1 flex-col justify-center px-6 pb-10 pt-6 sm:px-10 sm:pb-12 sm:pt-8 lg:px-12 lg:pb-16 lg:pt-4">
          <header className="mb-8 sm:mb-10 flex flex-col items-center text-center">
            {showLogo && (
              <ThemeLogo type="silhouette" size={48} className="mb-6" alt="DripDrop" />
            )}
            <h1 className="font-sans font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
              {title}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-sm">
              {subtitle}
            </p>
          </header>

          <div className="w-full max-w-sm mx-auto">{children}</div>
        </div>
      </div>
    </div>
  )
}
