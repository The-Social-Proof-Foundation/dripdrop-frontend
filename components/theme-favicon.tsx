'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

export default function ThemeFavicon() {
  const { theme } = useTheme()

  useEffect(() => {
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
    favicon.type = 'image/svg+xml'
    favicon.rel = 'icon'
    favicon.href = '/dripdrop-silhouette-white-sm.png'
    if (theme === 'dark') {
      favicon.href = '/dripdrop-silhouette-white-sm.png'
    } else if (theme === 'light') {
      favicon.href = '/dripdrop-silhouette-black-sm.png'
    } else {
      favicon.href = '/dripdrop-silhouette-white-sm.png'
    }

    document.head.appendChild(favicon)
  }, [theme])

  return null
} 