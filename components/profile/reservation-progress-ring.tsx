'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export interface ReservationProgressRingProps {
  percentage: number
  strokeWidth?: number
  padding?: number
  className?: string
  backgroundOpacity?: number
  progressGradientPreset?: 'default' | 'tokenBrand'
  imageDiameter?: number
  containInParent?: boolean
}

export function computeReservationRingShellLayout(
  imageDiameter: number,
  options: { padding?: number; strokeWidth?: number } = {},
): { shellSize: number; imageInset: number } {
  const padding = options.padding ?? 8
  const strokeWidth = options.strokeWidth ?? 7
  const shellSize = imageDiameter + padding * 2 + strokeWidth
  const imageInset = padding + strokeWidth / 2
  return { shellSize, imageInset }
}

export function ReservationProgressRing({
  percentage,
  strokeWidth = 7,
  padding = 8,
  className,
  backgroundOpacity = 0.08,
  progressGradientPreset = 'tokenBrand',
  imageDiameter = 36,
  containInParent = true,
}: ReservationProgressRingProps) {
  const progressGradientId = useId().replace(/:/g, '')

  const progressGradientFrom =
    progressGradientPreset === 'tokenBrand' ? '#DFFFA8' : 'hsl(var(--primary))'
  const progressGradientTo =
    progressGradientPreset === 'tokenBrand' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'

  const ringSize = imageDiameter + padding * 2 + strokeWidth

  const radius = useMemo(() => (ringSize - strokeWidth) / 2, [ringSize, strokeWidth])
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius])

  const targetOffset = useMemo(() => {
    const progress = Math.max(0, Math.min(100, percentage))
    return circumference - (progress / 100) * circumference
  }, [percentage, circumference])

  const revealProgressArc = percentage > 0

  const [animatedOffset, setAnimatedOffset] = useState(() => circumference)

  useEffect(() => {
    if (!revealProgressArc) {
      setAnimatedOffset(circumference)
      return
    }

    if (Number.isFinite(percentage) && percentage >= 100) {
      setAnimatedOffset(targetOffset)
      return
    }

    const duration = 800
    const startTime = Date.now()
    const startOffset = circumference

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentOffset = startOffset + (targetOffset - startOffset) * easeOutCubic
      setAnimatedOffset(currentOffset)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setAnimatedOffset(targetOffset)
      }
    }

    requestAnimationFrame(animate)
  }, [targetOffset, circumference, revealProgressArc, percentage])

  const center = ringSize / 2
  const offsetPosition = containInParent ? 0 : -padding - strokeWidth / 2

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        top: offsetPosition,
        left: offsetPosition,
        width: ringSize,
        height: ringSize,
      }}
    >
      <svg
        width={ringSize}
        height={ringSize}
        className={cn('origin-center transition-transform duration-300 ease-out', className)}
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        <defs>
          <linearGradient id={progressGradientId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor={progressGradientFrom} />
            <stop offset="100%" stopColor={progressGradientTo} />
          </linearGradient>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={
            backgroundOpacity !== undefined
              ? `rgba(255,255,255,${backgroundOpacity})`
              : 'hsl(var(--border))'
          }
          strokeWidth={strokeWidth}
          className={backgroundOpacity === undefined ? 'opacity-[0.14]' : undefined}
        />

        {revealProgressArc && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${progressGradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset}
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  )
}

export const AVATAR_RING_PRESETS = {
  navTrigger: { size: 36, padding: 3.5, strokeWidth: 2, backgroundOpacity: 0.08 },
  navDropdown: { size: 48, padding: 4, strokeWidth: 2.35, backgroundOpacity: 0.08 },
  profileHero: { size: 168, padding: 4, strokeWidth: 3.35, backgroundOpacity: 0.08 },
} as const

export type AvatarRingPreset = keyof typeof AVATAR_RING_PRESETS
