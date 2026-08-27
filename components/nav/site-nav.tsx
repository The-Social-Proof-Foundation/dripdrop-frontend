'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ThemeLogo } from '@/components/theme-logo'
import { HomeAuthNav } from '@/components/profile/home-auth-nav'
import { LiquidGlassCapsule } from '@/components/nav/liquid-glass-capsule'
import { NavThemeToggle } from '@/components/nav/nav-theme-toggle'

gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

const SCROLL_DOWN_THRESHOLD_PX = 32
const SCROLL_UP_THRESHOLD_PX = 8

function getScrollY(): number {
  const smoother = ScrollSmoother.get()
  return smoother ? smoother.scrollTop() : window.scrollY
}

export function SiteNav() {
  const pathname = usePathname()
  const navShellRef = useRef<HTMLDivElement>(null)
  const scrolledRef = useRef(false)

  useEffect(() => {
    const shell = navShellRef.current
    if (!shell) return

    gsap.set(shell, { scale: 1, transformOrigin: 'top center' })

    const applyScale = (next: boolean) => {
      gsap.to(shell, {
        scale: next ? 0.94 : 1,
        duration: 0.28,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    const update = () => {
      const scrollY = getScrollY()
      let next = scrolledRef.current

      if (scrollY > SCROLL_DOWN_THRESHOLD_PX) {
        next = true
      } else if (scrollY <= SCROLL_UP_THRESHOLD_PX) {
        next = false
      }

      if (next === scrolledRef.current) return

      scrolledRef.current = next
      applyScale(next)
    }

    const reset = () => {
      scrolledRef.current = false
      gsap.set(shell, { scale: 1 })
    }

    reset()
    update()

    ScrollTrigger.addEventListener('scrollEnd', update)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      ScrollTrigger.removeEventListener('scrollEnd', update)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [pathname])

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-6">
      <div
        ref={navShellRef}
        className="pointer-events-auto w-full max-w-3xl will-change-transform"
      >
        <LiquidGlassCapsule className="w-full">
          <nav
            className="relative flex items-center px-3 py-3 sm:px-4"
            aria-label="Main"
          >
            <NavThemeToggle />

            <Link
              href="/"
              className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full transition-opacity hover:opacity-80"
              aria-label="DripDrop home"
            >
              <ThemeLogo type="silhouette" size={28} alt="DripDrop" />
            </Link>

            <div className="ml-auto flex shrink-0 items-center">
              <HomeAuthNav />
            </div>
          </nav>
        </LiquidGlassCapsule>
      </div>
    </header>
  )
}
