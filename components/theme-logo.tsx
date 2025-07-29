'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface ThemeLogoProps {
  type: 'silhouette' | 'horizontal'
  size?: number
  className?: string
  alt?: string
}

export function ThemeLogo({ type, size = 32, className = '', alt }: ThemeLogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder during SSR/hydration
    return (
      <div 
        className={`${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  // Determine which logo to show based on theme
  const currentTheme = resolvedTheme || theme
  const isLight = currentTheme === 'light'
  
  const logoSrc = isLight 
    ? `/dripdrop-${type}-gray-sm.png`
    : `/dripdrop-${type}-white-sm.png`

  const logoAlt = alt || `DripDrop ${type === 'silhouette' ? 'Logo' : 'Brand'}`

  return (
    <Image
      src={logoSrc}
      alt={logoAlt}
      width={size}
      height={type === 'horizontal' ? size * 0.4 : size} // Horizontal logo is wider, adjust height
      className={`object-contain transition-opacity duration-300 ${className}`}
      priority
    />
  )
} 