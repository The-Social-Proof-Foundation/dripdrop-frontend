'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

const CHECK_PATH_LENGTH = 28

export type SuccessCheckProps = {
  className?: string
  size?: number
}

export function SuccessCheck({ className, size = 80 }: SuccessCheckProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      el.setAttribute('data-state', 'in')
      return
    }

    const frame = window.requestAnimationFrame(() => {
      el.setAttribute('data-state', 'in')
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <span
      ref={ref}
      className={cn('t-success-check', className)}
      data-state="out"
      aria-hidden="true"
      style={{ ['--check-path-length' as string]: `${CHECK_PATH_LENGTH}` }}
    >
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="hsl(var(--highlight))" />
        <path
          d="M15 24.5L21.5 31L33 18"
          stroke="hsl(var(--background))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
