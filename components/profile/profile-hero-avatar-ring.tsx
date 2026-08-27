'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  AVATAR_RING_PRESETS,
  computeReservationRingShellLayout,
  ReservationProgressRing,
} from '@/components/profile/reservation-progress-ring'

interface ProfileHeroAvatarRingProps {
  children: ReactNode
  showRing: boolean
  ringPercent: number
  className?: string
}

/**
 * Wraps the profile-page hero avatar with an optional SPT reservation ring.
 */
export function ProfileHeroAvatarRing({
  children,
  showRing,
  ringPercent,
  className,
}: ProfileHeroAvatarRingProps) {
  const { size: imageDiameter, padding, strokeWidth, backgroundOpacity } =
    AVATAR_RING_PRESETS.profileHero

  if (!showRing) {
    return (
      <div
        className={cn(
          'relative mx-auto h-[158px] w-[158px] shrink-0 overflow-hidden rounded-full border-[5px] border-background bg-background lg:h-[168px] lg:w-[168px] xl:h-[178px] xl:w-[178px]',
          className,
        )}
      >
        {children}
      </div>
    )
  }

  const ringShell = computeReservationRingShellLayout(imageDiameter, {
    padding,
    strokeWidth,
  })

  return (
    <div
      className={cn('relative mx-auto shrink-0 overflow-visible', className)}
      style={{
        width: ringShell.shellSize,
        height: ringShell.shellSize,
      }}
    >
      <div
        className="absolute z-0 overflow-hidden rounded-full border-[5px] border-background bg-background"
        style={{
          top: ringShell.imageInset,
          left: ringShell.imageInset,
          width: imageDiameter,
          height: imageDiameter,
        }}
      >
        {children}
      </div>
      <ReservationProgressRing
        percentage={ringPercent}
        padding={padding}
        strokeWidth={strokeWidth}
        imageDiameter={imageDiameter}
        containInParent
        backgroundOpacity={backgroundOpacity}
        progressGradientPreset="tokenBrand"
      />
    </div>
  )
}
