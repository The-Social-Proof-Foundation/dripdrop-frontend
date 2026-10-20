'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

function getTextSwapDurationMs(): number {
  if (typeof window === 'undefined') return 280
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--text-swap-dur').trim()
  const parsed = parseFloat(raw)
  if (!Number.isFinite(parsed)) return 280
  return raw.endsWith('ms') || !raw.endsWith('s') ? parsed : parsed * 1000
}

export type TextSwapProps = {
  text: string
  className?: string
}

export function TextSwap({ text, className }: TextSwapProps) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const [displayText, setDisplayText] = useState(text)
  const prevTextRef = useRef(text)

  useEffect(() => {
    if (text === prevTextRef.current) return

    const el = spanRef.current
    if (!el) {
      setDisplayText(text)
      prevTextRef.current = text
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setDisplayText(text)
      prevTextRef.current = text
      return
    }

    el.classList.add('is-exit')

    const timer = window.setTimeout(() => {
      setDisplayText(text)
      el.classList.remove('is-exit')
      el.classList.add('is-enter-start')
      void el.offsetHeight
      el.classList.remove('is-enter-start')
      prevTextRef.current = text
    }, getTextSwapDurationMs())

    return () => window.clearTimeout(timer)
  }, [text])

  return (
    <span ref={spanRef} className={cn('t-text-swap', className)}>
      {displayText}
    </span>
  )
}
