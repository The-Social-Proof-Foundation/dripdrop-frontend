import { PROFILE_FULL } from '@/lib/graphql/profile-full'
import { createMySoGraphQLClient } from '@/lib/myso-graphql-client'
import type { NetworkType } from '@/lib/network-utils'
import { getCurrentNetwork } from '@/lib/network-utils'
import type { MySocialProfile } from '@/lib/profile-utils'

export type GraphqlProfileRecord = Record<string, unknown> | null | undefined

function intTimestampToIso(ts: number | null | undefined): string {
  if (ts == null || ts <= 0) return ''
  const ms = ts < 1_000_000_000_000 ? ts * 1000 : ts
  try {
    return new Date(ms).toISOString()
  } catch {
    return ''
  }
}

function asStr(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length ? s : null
}

function asNum(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }
  return fallback
}

function asObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
}

/**
 * Reservation pool progress from GraphQL `socialProofToken`:
 * `totalReserved / requiredThreshold × 100`, fallback `reservationPercentage`.
 */
export function reservationPoolFillPercentFromGraphqlProfile(
  profile: GraphqlProfileRecord,
): number | null {
  const p = asObj(profile)
  if (!p) return null
  const spt = asObj(p.socialProofToken)
  if (!spt) return null
  const reqThresh = asNum(spt.requiredThreshold)
  const totalRes = asNum(spt.totalReserved)
  if (reqThresh > 0) {
    return (totalRes / reqThresh) * 100
  }
  const pct = asNum(spt.reservationPercentage)
  if (pct > 0 && Number.isFinite(pct)) {
    return pct
  }
  return null
}

export type ProfileReservationRing = {
  showRing: boolean
  ringPercent: number
}

export function getProfileReservationRing(
  profile: MySocialProfile | null | undefined,
): ProfileReservationRing {
  if (!profile) {
    return { showRing: false, ringPercent: 0 }
  }

  const reservationPoolAddr = profile.reservation_pool_address?.trim() ?? ''
  const hasLaunchedSpt = Boolean(profile.social_proof_token_address?.trim())

  if (hasLaunchedSpt) {
    return { showRing: true, ringPercent: 100 }
  }

  if (reservationPoolAddr) {
    const fill = profile.reservation_fill_percent
    const ringPercent =
      fill != null && Number.isFinite(fill) ? Math.max(0, fill) : 0
    return { showRing: true, ringPercent }
  }

  return { showRing: false, ringPercent: 0 }
}

/** True when a string is a valid `next/image` src (relative path or absolute http(s) URL). */
export function isNextImageCompatibleSrc(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  )
}

/** Unwrap nested Next image optimizer URLs (/_next/image?url=...) to the real asset URL. */
export function normalizeExternalImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  let current = value.trim()
  if (!current) return null

  for (let i = 0; i < 3; i++) {
    try {
      const parsed = new URL(current)
      if (!parsed.pathname.endsWith('/_next/image')) {
        break
      }
      const nested = parsed.searchParams.get('url')
      if (!nested) {
        break
      }
      current = decodeURIComponent(nested).trim()
      if (!current) return null
    } catch {
      break
    }
  }

  return isNextImageCompatibleSrc(current) ? current : null
}

/**
 * Map GraphQL `Profile` to the REST-shaped `MySocialProfile` used across the UI.
 */
export function mapGraphqlProfileToMySocial(profile: GraphqlProfileRecord): MySocialProfile | null {
  if (!profile) return null
  const p = profile as Record<string, unknown>
  const ownerAddr = asStr(p.address)
  if (!ownerAddr) return null

  const usernameRaw = asStr(p.username)
  const profileId = asStr(p.profileId) ?? ownerAddr
  const rawId = p.id
  const idParsed =
    typeof rawId === 'number'
      ? rawId
      : parseInt(typeof rawId === 'string' ? rawId : String(rawId ?? ''), 10)

  const reservationPoolAddress =
    asStr(p.reservationPoolAddress) ??
    asStr(asObj(p.socialProofToken)?.reservationPoolId)
  const socialProofTokenAddress = asStr(p.socialProofTokenAddress)
  const reservationFillPercent = reservationPoolFillPercentFromGraphqlProfile(profile)

  return {
    id: Number.isFinite(idParsed) ? idParsed : 0,
    owner_address: ownerAddr,
    username: usernameRaw,
    display_name: asStr(p.displayName),
    bio: asStr(p.bio),
    profile_photo: normalizeExternalImageUrl(p.profilePhoto),
    website: asStr(p.website),
    created_at: intTimestampToIso(asNum(p.createdAt) || undefined),
    updated_at: intTimestampToIso(asNum(p.updatedAt) || undefined),
    cover_photo: normalizeExternalImageUrl(p.coverPhoto),
    profile_id: profileId,
    followers_count: asNum(p.followersCount),
    following_count: asNum(p.followingCount),
    post_count: asNum(p.postCount),
    min_offer_amount: p.minOfferAmount != null ? asNum(p.minOfferAmount) : null,
    birthdate: asStr(p.birthdate),
    current_location: asStr(p.location),
    raised_location: null,
    phone: null,
    email: null,
    gender: null,
    political_view: null,
    religion: null,
    education: null,
    primary_language: null,
    relationship_status: null,
    x_username: asStr(p.xUsername),
    mastodon_username: null,
    facebook_username: null,
    reddit_username: null,
    github_username: null,
    block_list_address: asStr(p.blockListAddress),
    reservation_pool_address: reservationPoolAddress,
    social_proof_token_address: socialProofTokenAddress,
    reservation_fill_percent: reservationFillPercent,
  }
}

/**
 * Fetch a profile by wallet address via GraphQL (works outside React hooks).
 */
export async function fetchProfileByAddressGraphql(
  address: string,
  network?: NetworkType,
): Promise<MySocialProfile | null> {
  const resolvedNetwork = network ?? getCurrentNetwork()
  const client = createMySoGraphQLClient(resolvedNetwork)

  try {
    const result = await client.query({
      query: PROFILE_FULL,
      variables: { address },
    })

    if (result.errors && result.errors.length > 0) {
      console.error('[GraphQL] ProfileFull failed:', result.errors[0]?.message)
      return null
    }

    const record = (result.data as { profile?: GraphqlProfileRecord } | undefined)?.profile
    return mapGraphqlProfileToMySocial(record)
  } catch (error) {
    console.error('[GraphQL] ProfileFull request failed:', error)
    return null
  }
}
