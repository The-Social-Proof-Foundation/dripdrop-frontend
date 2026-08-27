'use client'

import { cn } from '@/lib/utils'
import { DEFAULT_AVATAR } from '@/lib/default-avatar'

interface DefaultAvatarImageProps {
  className?: string
}

export function DefaultAvatarImage({ className }: DefaultAvatarImageProps) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={DEFAULT_AVATAR.light}
        alt=""
        aria-hidden
        className={cn('h-full w-full object-cover dark:hidden', className)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={DEFAULT_AVATAR.dark}
        alt=""
        aria-hidden
        className={cn('hidden h-full w-full object-cover dark:block', className)}
      />
    </>
  )
}
