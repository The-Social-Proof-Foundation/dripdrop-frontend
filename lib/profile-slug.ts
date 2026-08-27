import type { MySocialProfile } from '@/lib/profile-utils'

/** Sui wallet addresses are 0x + 64 hex chars. */
const WALLET_SLUG_RE = /^0x[a-fA-F0-9]{64}$/

export function isWalletSlug(slug: string): boolean {
  return WALLET_SLUG_RE.test(slug)
}

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase()
}

export function addressesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false
  return normalizeAddress(a) === normalizeAddress(b)
}

export function usernamesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = a?.trim().toLowerCase()
  const right = b?.trim().toLowerCase()
  if (!left || !right) return false
  return left === right
}

export function truncateAddress(address: string): string {
  if (address.length <= 16) return address
  return `${address.slice(0, 8)}...${address.slice(-8)}`
}

export function abbreviateAddress(address: string, head = 12, tail = 12): string {
  if (address.length <= head + tail + 3) return address
  return `${address.slice(0, head)}...${address.slice(-tail)}`
}

export function getProfilePath(
  address: string,
  profile: Pick<MySocialProfile, 'username'> | null | undefined,
): string {
  const username = profile?.username?.trim()
  if (username) return `/${username}`
  return `/${address}`
}
