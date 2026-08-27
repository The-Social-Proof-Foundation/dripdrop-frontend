'use client'

import { RequireAuth } from '@/components/waitlist/require-auth'
import { CreatorApplyForm } from '@/components/waitlist/creator-apply-form'
import { ThemeLogo } from '@/components/theme-logo'

export function CreatorsPageClient() {
  return (
    <RequireAuth>
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 pt-24 pb-16 sm:px-10">
        <header className="mb-8 sm:mb-10 flex flex-col items-center text-center max-w-md">
          <ThemeLogo type="silhouette" size={48} className="mb-6" alt="DripDrop" />
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
            Creator early access
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Apply for a complimentary creator badge and priority consideration for TestFlight.
          </p>
        </header>

        <div className="w-full max-w-sm">
          <CreatorApplyForm />
        </div>
      </div>
    </RequireAuth>
  )
}
