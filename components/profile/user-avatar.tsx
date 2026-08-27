'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DefaultAvatarImage } from '@/components/profile/default-avatar-image'
import {
  AVATAR_RING_PRESETS,
  computeReservationRingShellLayout,
  ReservationProgressRing,
  type AvatarRingPreset,
} from '@/components/profile/reservation-progress-ring'

const SIZE_MAP = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-24 w-24',
} as const

const SIZE_PX = {
  sm: 36,
  md: 48,
  lg: 96,
} as const

type UserAvatarSize = keyof typeof SIZE_MAP

interface UserAvatarProps {
  imageSrc?: string | null
  size?: UserAvatarSize
  interactive?: boolean
  className?: string
  alt?: string
  showRing?: boolean
  ringPercent?: number
  ringPreset?: AvatarRingPreset
}

export function UserAvatar({
  imageSrc,
  size = 'sm',
  interactive = false,
  className,
  alt = 'Profile avatar',
  showRing = false,
  ringPercent = 0,
  ringPreset,
}: UserAvatarProps) {
  const resolvedSrc = imageSrc?.trim() || null
  const preset =
    ringPreset ??
    (size === 'sm' ? 'navTrigger' : size === 'md' ? 'navDropdown' : 'navDropdown')
  const ringConfig = AVATAR_RING_PRESETS[preset]
  const imageDiameter = ringConfig?.size ?? SIZE_PX[size]
  const padding = ringConfig?.padding ?? 3.5
  const strokeWidth = ringConfig?.strokeWidth ?? 2
  const backgroundOpacity = ringConfig?.backgroundOpacity ?? 0.08

  const ringShell = showRing
    ? computeReservationRingShellLayout(imageDiameter, { padding, strokeWidth })
    : null

  const avatar = (
    <Avatar
      className={cn(
        !showRing && SIZE_MAP[size],
        showRing && 'h-full w-full',
        interactive && 'transition-transform duration-150 ease-out hover:scale-105 active:scale-95',
        className,
      )}
    >
      <AvatarImage
        src={resolvedSrc ?? undefined}
        alt={alt}
        className="object-cover"
        referrerPolicy="no-referrer"
      />
      <AvatarFallback className="bg-muted p-0">
        <DefaultAvatarImage />
      </AvatarFallback>
    </Avatar>
  )

  if (!showRing) {
    return avatar
  }

  return (
    <div
      className="relative shrink-0 overflow-visible"
      style={{
        width: ringShell!.shellSize,
        height: ringShell!.shellSize,
      }}
    >
      <div
        className="absolute z-0 overflow-hidden rounded-full"
        style={{
          top: ringShell!.imageInset,
          left: ringShell!.imageInset,
          width: imageDiameter,
          height: imageDiameter,
        }}
      >
        {avatar}
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

export { SIZE_MAP as USER_AVATAR_SIZES }
