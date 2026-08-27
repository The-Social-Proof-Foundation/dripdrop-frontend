export const REFERRAL_STORAGE_KEY = 'waitlist_referral_code'
export const INVITE_STORAGE_KEY = 'waitlist_invite_code'

/** Persist `ref`, `referralCode`, and `invite` query params from a URL search string. */
export function captureReferralParamsFromSearch(search: string): void {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const ref = params.get('ref')?.trim() || params.get('referralCode')?.trim() || null
  const invite = params.get('invite')?.trim() || null

  if (ref) sessionStorage.setItem(REFERRAL_STORAGE_KEY, ref)
  if (invite) sessionStorage.setItem(INVITE_STORAGE_KEY, invite)
}

export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(REFERRAL_STORAGE_KEY)
}

export function getStoredInviteCode(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(INVITE_STORAGE_KEY)
}

export function clearReferralParams(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(REFERRAL_STORAGE_KEY)
  sessionStorage.removeItem(INVITE_STORAGE_KEY)
}

/** Append stored (or current URL) referral/invite params to an internal path href. */
export function appendReferralParamsToHref(href: string): string {
  if (typeof window === 'undefined') return href

  captureReferralParamsFromSearch(window.location.search)

  const ref = getStoredReferralCode()
  const invite = getStoredInviteCode()
  if (!ref && !invite) return href

  const [path, query = ''] = href.split('?')
  const params = new URLSearchParams(query)
  if (ref) params.set('ref', ref)
  if (invite) params.set('invite', invite)
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}
