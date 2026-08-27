import { Geist, Geist_Mono, Manrope, Plus_Jakarta_Sans } from 'next/font/google'

/**
 * Primary UI font (#1). To switch back, change `sans`/`body`/`heading` in tailwind.config.ts:
 * - Geist → `var(--font-geist)`
 * - Plus Jakarta Sans → `var(--font-jakarta)`
 * Alternate fonts stay loaded below.
 */
export const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

/** Alternate sans #2 — use `font-jakarta` or set tailwind `sans` to `--font-jakarta`. */
export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

/** Alternate sans #3 — use `font-geist` or set tailwind `sans` to `--font-geist`. */
export const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: true,
})

export const fontVariables = [
  manrope.variable,
  plusJakartaSans.variable,
  geist.variable,
  geistMono.variable,
].join(' ')
