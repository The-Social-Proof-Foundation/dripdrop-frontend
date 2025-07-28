'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

export default function ThemeFavicon() {
  const { theme } = useTheme()

  useEffect(() => {
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
    favicon.type = 'image/svg+xml'
    favicon.rel = 'icon'
    favicon.href = '/favicon-dd.ico'
    if (theme === 'dark') {
      favicon.href = '/favicon-dd.ico'
    } else if (theme === 'light') {
      favicon.href = '/favicon-dd.ico'
    } else {
      favicon.href = '/favicon-dd.ico'
    }

    document.head.appendChild(favicon)
  }, [theme])

  return null
} 