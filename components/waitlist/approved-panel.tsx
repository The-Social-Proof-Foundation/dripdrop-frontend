'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export function ApprovedPanel({
  variant = 'inline',
}: {
  variant?: 'inline' | 'page'
}) {
  const isPage = variant === 'page'

  return (
    <div
      className={`flex flex-col gap-5 w-full ${
        isPage ? 'text-center items-center' : 'max-w-md mx-auto text-center items-center'
      }`}
    >
      <CheckCircle2 className="h-12 w-12 text-green-500" />

      <Link
        href="https://apps.apple.com/app/dripdrop"
        target="_blank"
        rel="noopener noreferrer"
        className="opacity-90 hover:opacity-100 transition-opacity"
      >
        <Image
          src="/Pre-order_on_the_App_Store_Badge_US-UK_RGB_wht_121217.svg"
          alt="Download on the App Store"
          width={160}
          height={48}
          className="dark:block hidden"
        />
        <Image
          src="/Pre-order_on_the_App_Store_Badge_US-UK_RGB_blk_121217.svg"
          alt="Download on the App Store"
          width={160}
          height={48}
          className="dark:hidden block"
        />
      </Link>
    </div>
  )
}
