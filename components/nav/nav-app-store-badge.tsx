'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const APP_STORE_URL = 'https://apps.apple.com/app/dripdrop'

export function NavAppStoreBadge({
  imageClassName = 'h-9 w-auto',
  className,
}: {
  imageClassName?: string
  className?: string
}) {
  return (
    <Link
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Pre-order on the App Store"
      className={cn('shrink-0 opacity-90 transition-opacity hover:opacity-100', className)}
    >
      <Image
        src="/Pre-order_on_the_App_Store_Badge_US-UK_RGB_wht_121217.svg"
        alt=""
        width={140}
        height={42}
        className={cn('hidden dark:block', imageClassName)}
      />
      <Image
        src="/Pre-order_on_the_App_Store_Badge_US-UK_RGB_blk_121217.svg"
        alt=""
        width={140}
        height={42}
        className={cn('block dark:hidden', imageClassName)}
      />
    </Link>
  )
}
