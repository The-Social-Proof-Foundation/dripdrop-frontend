'use client'

import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export type LiquidGlassShape = 'capsule' | 'card'

export interface LiquidGlassMaterialProps extends HTMLAttributes<HTMLDivElement> {
  shape?: LiquidGlassShape
  /** Card/capsule corner radius utility classes (card defaults to rounded-xl). */
  radius?: string
  /** Stronger fill for floating panels (e.g. profile dropdown). */
  tintStrength?: 'default' | 'strong'
}

export const LiquidGlassMaterial = forwardRef<HTMLDivElement, LiquidGlassMaterialProps>(
  function LiquidGlassMaterial(
    { children, className, shape = 'capsule', radius, tintStrength = 'default', style, ...props },
    ref,
  ) {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    const isDark = mounted && resolvedTheme === 'dark'
    const isStrong = tintStrength === 'strong'
    const rounded =
      shape === 'capsule' ? 'rounded-full' : (radius ?? 'rounded-xl')

    const glassStyle: CSSProperties | undefined = mounted
      ? {
          backgroundColor: isDark
            ? isStrong
              ? 'rgba(0, 0, 0, 0.68)'
              : 'rgba(0, 0, 0, 0.38)'
            : isStrong
              ? 'rgba(255, 255, 255, 0.82)'
              : 'rgba(255, 255, 255, 0.38)',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: isDark
            ? isStrong
              ? 'rgba(255, 255, 255, 0.14)'
              : 'rgba(255, 255, 255, 0.1)'
            : isStrong
              ? 'rgba(255, 255, 255, 0.55)'
              : 'rgba(255, 255, 255, 0.32)',
          boxShadow: isDark
            ? isStrong
              ? '0 12px 32px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 8px 28px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            : isStrong
              ? '0 12px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.65)'
              : '0 8px 28px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
          ...style,
        }
      : style

    return (
      <div
        ref={ref}
        className={cn(
          'relative isolate overflow-hidden text-foreground',
          'backdrop-blur-xl backdrop-saturate-125',
          rounded,
          !mounted && 'border border-border/40 bg-background/60',
          className,
        )}
        style={glassStyle}
        {...props}
      >
        {mounted && (
          <>
            <div
              aria-hidden
              className={cn('pointer-events-none absolute inset-0', rounded)}
              style={{
                background: isDark
                  ? 'linear-gradient(to bottom, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 40%, transparent 100%)'
                  : 'linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.06) 45%, transparent 100%)',
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-px"
              style={{
                background: isDark
                  ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.22), transparent)'
                  : 'linear-gradient(to right, transparent, rgba(255,255,255,0.55), transparent)',
              }}
            />
          </>
        )}
        <div className={cn('relative z-10 overflow-hidden', rounded)}>{children}</div>
      </div>
    )
  },
)

/** Capsule wrapper — same as `<LiquidGlassMaterial shape="capsule" />`. */
export function LiquidGlassCapsule({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <LiquidGlassMaterial shape="capsule" className={className}>
      {children}
    </LiquidGlassMaterial>
  )
}
