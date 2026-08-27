export const DEFAULT_AVATAR = {
  light: '/default-avatar-light.png',
  dark: '/default-avatar.png',
} as const

export function getDefaultAvatarSrc(theme?: string | null): string {
  return theme === 'light' ? DEFAULT_AVATAR.light : DEFAULT_AVATAR.dark
}

export function getDefaultAvatarFromDocument(): string {
  if (typeof document === 'undefined') return DEFAULT_AVATAR.dark
  return document.documentElement.classList.contains('dark')
    ? DEFAULT_AVATAR.dark
    : DEFAULT_AVATAR.light
}
