'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

const FAVICON = {
  light: '/dripdrop-silhouette-black-sm.ico',
  dark: '/dripdrop-silhouette-white-sm.ico',
} as const

export default function ThemeFavicon() {
  const { resolvedTheme, theme } = useTheme()

  useEffect(() => {
    const current = resolvedTheme || theme
    if (current !== 'light' && current !== 'dark') return

    const href = current === 'light' ? FAVICON.light : FAVICON.dark
    document.querySelectorAll("link[rel='icon']").forEach((node) => node.remove())

    const favicon = document.createElement('link')
    favicon.rel = 'icon'
    favicon.type = 'image/x-icon'
    favicon.href = href
    document.head.appendChild(favicon)
  }, [resolvedTheme, theme])

  return null
}
