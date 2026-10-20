import { getCurrentNetwork } from '@/lib/network-utils'
import { zkLoginProverNetwork } from '@/lib/zklogin/prover-network'
import { setZkLoginProofRecovered } from '@/lib/zklogin/auth-busy'
import { clearZkLoginSigner, loadZkLoginSigner, saveZkLoginSigner, type ZkLoginRestoreRecord } from '@/lib/zklogin/persist'
import { MySoJsonRpcClient } from '@socialproof/myso/jsonRpc'
import { Ed25519Keypair } from '@socialproof/myso/keypairs/ed25519'
import {
  decodeJwt,
  genAddressSeed,
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  getZkLoginSignature,
  jwtToAddress,
} from '@socialproof/myso/zklogin'

const ACCOUNT_FLAG = 'mysocial_zklogin_account'
const PENDING_KEY = 'mysocial_zklogin_pending'

export type ZkProof = {
  proofPoints: { a: string[]; b: string[][]; c: string[] }
  issBase64Details: { value: string; indexMod4: number }
  headerBase64: string
  proofVersion: number
}

const PROOF_VERSION = 3

type ChainClock = { epoch: number; epochDurationMs: number; maxEpochDelta: number | null }

type Pending = {
  ephemeral: Ed25519Keypair
  randomness: string
  maxEpoch: number
  nonce: string
  clock?: ChainClock
}

type ZkSession = Pending & {
  address: string
  addressSeed: string
  proof: ZkProof
}

type DecodedJwt = ReturnType<typeof decodeJwt>

let pending: Pending | null = null
let current: ZkSession | null = null

export function isZkLoginAccount(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(ACCOUNT_FLAG) === '1'
}

export function zkLoginPending(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(PENDING_KEY) != null
}

export function zkLoginAddress(): string | null {
  return current?.address ?? null
}

export function zkLoginEphemeralKeypair(): Ed25519Keypair | null {
  return current?.ephemeral ?? null
}

export function endZkLoginRuntime(): void {
  current = null
  pending = null
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PENDING_KEY)
  sessionStorage.removeItem('mysocial_zklogin_error')
  localStorage.removeItem(ACCOUNT_FLAG)
}

export function clearZkLoginSession(): void {
  endZkLoginRuntime()
  void clearZkLoginSigner()
}

/** Auth listens and signs the user out; session.ts stays free of the Auth SDK. */
export const ZKLOGIN_PROOF_EXPIRED_EVENT = 'mysocial-zklogin-expired'

export type ZkLoginRestoreStatus = 'ok' | 'expired' | 'missing' | 'clock-unavailable' | 'invalid'

function base64UrlBits(value: string): number[] {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  const bits: number[] = []
  for (const char of value) {
    const index = alphabet.indexOf(char)
    if (index < 0) throw new Error('Invalid token encoding.')
    for (let shift = 5; shift >= 0; shift -= 1) bits.push((index >> shift) & 1)
  }
  return bits
}

function decodePackedClaim(value: string, index: number): string {
  let bits = base64UrlBits(value)
  const first = index % 4
  if (first === 1) bits = bits.slice(2)
  else if (first === 2) bits = bits.slice(4)
  else if (first !== 0) throw new Error('Issuer claim is not packed.')
  const last = (index + value.length - 1) % 4
  if (last === 2) bits = bits.slice(0, -2)
  else if (last === 1) bits = bits.slice(0, -4)
  else if (last !== 3) throw new Error('Issuer claim is not packed.')
  const bytes = new Uint8Array(bits.length / 8)
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8).join(''), 2)
  }
  return new TextDecoder().decode(bytes)
}

export function extractIssClaim(jwt: string): { value: string; indexMod4: number } {
  const payload = jwt.split('.')[1] ?? ''
  for (let start = 0; start < payload.length; start += 1) {
    if (start % 4 === 3) continue
    for (let end = start + 8; end <= payload.length; end += 1) {
      const last = (start + (end - start) - 1) % 4
      if (last === 0) continue
      try {
        const decoded = decodePackedClaim(payload.slice(start, end), start)
        if (!decoded.startsWith('"iss":') || (!decoded.endsWith(',') && !decoded.endsWith('}'))) continue
        const parsed = JSON.parse(`{${decoded.slice(0, -1)}}`) as { iss?: string }
        if (typeof parsed.iss === 'string' && Object.keys(parsed).length === 1) {
          return { value: payload.slice(start, end), indexMod4: start % 4 }
        }
      } catch {
        // This window is not the issuer claim.
      }
    }
  }
  throw new Error('OAuth token is missing the issuer claim.')
}

function elementToDecimal(element: string): string {
  if (/^[0-9]+$/.test(element)) return element
  const bytes = Uint8Array.from(atob(element), (char) => char.charCodeAt(0))
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return BigInt(`0x${hex || '0'}`).toString()
}

function decimalTriple(value: string[] | { e0?: { element?: string }; e1?: { element?: string }; e2?: { element?: string } }): string[] {
  if (Array.isArray(value)) return value.map(elementToDecimal)
  return ['e0', 'e1', 'e2'].map((key) => elementToDecimal(value[key as 'e0' | 'e1' | 'e2']?.element ?? ''))
}

function decimalPairs(value: string[][] | Record<string, { element?: string }>): string[][] {
  if (Array.isArray(value)) return value.map((pair) => pair.map(elementToDecimal))
  // The prover stores each G2 x/y limb swapped (e00 = c1, e01 = c0). The chain wants [c0, c1].
  // The projective Z limb is already [1, 0] and must not be swapped.
  return [
    ['e01', 'e00'],
    ['e11', 'e10'],
    ['e20', 'e21'],
  ].map((pair) => pair.map((key) => elementToDecimal(value[key]?.element ?? '')))
}

function proofPointsMatchChain(points: { a: string[]; b: string[][]; c: string[] }): boolean {
  const decimal = (value: string) => /^[0-9]+$/.test(value)
  return (
    points.a.length === 3 &&
    points.c.length === 3 &&
    points.a.every(decimal) &&
    points.c.every(decimal) &&
    points.a[2] === '1' &&
    points.c[2] === '1' &&
    points.b.length === 3 &&
    points.b.every((pair) => pair.length === 2 && pair.every(decimal)) &&
    points.b[2]?.[0] === '1' &&
    points.b[2]?.[1] === '0'
  )
}

function issClaimDecodes(claim: { value: string; indexMod4: number } | undefined): boolean {
  if (!claim?.value || claim.indexMod4 > 2) return false
  try {
    const decoded = decodePackedClaim(claim.value, claim.indexMod4)
    if (!decoded.startsWith('"iss":') || (!decoded.endsWith(',') && !decoded.endsWith('}'))) return false
    const parsed = JSON.parse(`{${decoded.slice(0, -1)}}`) as { iss?: string }
    return typeof parsed.iss === 'string' && Object.keys(parsed).length === 1
  } catch {
    return false
  }
}

function proofAcceptable(proof: ZkProof): boolean {
  return (
    proof.proofVersion === PROOF_VERSION &&
    proofPointsMatchChain(proof.proofPoints) &&
    issClaimDecodes(proof.issBase64Details) &&
    proof.headerBase64.length > 0
  )
}

function issuerClaim(jwt: string): { value: string; indexMod4: number } {
  const claim = extractIssClaim(jwt)
  const decoded = decodePackedClaim(claim.value, claim.indexMod4)
  const parsed = JSON.parse(`{${decoded.slice(0, -1)}}`) as { iss?: string }
  if (parsed.iss !== decodeJwt(jwt).rawIss) throw new Error('OAuth token issuer claim does not match.')
  return claim
}

function normalizeProof(body: {
  proofPoints?: {
    a?: string[] | { e0?: { element?: string }; e1?: { element?: string }; e2?: { element?: string } }
    b?: string[][] | Record<string, { element?: string }>
    c?: string[] | { e0?: { element?: string }; e1?: { element?: string }; e2?: { element?: string } }
  }
}, jwt: string): ZkProof {
  const points = body.proofPoints
  if (!points?.a || !points.b || !points.c) throw new Error('zkLogin prover returned an incomplete proof.')
  const headerBase64 = jwt.split('.')[0] ?? ''
  if (!headerBase64) throw new Error('OAuth token is missing a header.')
  const proofPoints = {
    a: decimalTriple(points.a),
    b: decimalPairs(points.b),
    c: decimalTriple(points.c),
  }
  if (!proofPointsMatchChain(proofPoints)) throw new Error('zkLogin prover returned proof points the chain will not accept.')
  return {
    proofPoints,
    issBase64Details: issuerClaim(jwt),
    headerBase64,
    proofVersion: PROOF_VERSION,
  }
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
/** Enforced by the chain even when system state omits zkloginMaxEpochUpperBoundDelta. */
const DEFAULT_MAX_EPOCH_DELTA = 30

const CLOCK_CACHE_MS = 60_000
let cachedClock: (ChainClock & { at: number }) | null = null

async function chainClock(): Promise<ChainClock> {
  if (cachedClock && Date.now() - cachedClock.at < CLOCK_CACHE_MS) {
    const { at: _at, ...clock } = cachedClock
    return clock
  }
  const rpc = new MySoJsonRpcClient({ url: '/api/fullnode', network: getCurrentNetwork() })
  const state = await rpc.getLatestMySoSystemState()
  const epoch = Number(state.epoch)
  const duration = Number(state.epochDurationMs)
  // Returned by the fullnode but missing from the SDK's MySoSystemStateSummary type.
  const delta = Number((state as { zkloginMaxEpochUpperBoundDelta?: string | number }).zkloginMaxEpochUpperBoundDelta)
  if (!Number.isFinite(epoch)) throw new Error('Could not read the current epoch.')
  const clock = {
    epoch,
    epochDurationMs: Number.isFinite(duration) && duration > 0 ? duration : 86_400_000,
    maxEpochDelta: Number.isFinite(delta) && delta > 0 ? delta : null,
  }
  cachedClock = { ...clock, at: Date.now() }
  return clock
}

function chainEpochCap(maxEpochDelta: number | null): number {
  return maxEpochDelta != null && maxEpochDelta > 0 ? maxEpochDelta : DEFAULT_MAX_EPOCH_DELTA
}

function horizonEpochs(epochDurationMs: number, maxEpochDelta: number | null): number {
  const chainCap = chainEpochCap(maxEpochDelta)
  if (getCurrentNetwork() !== 'mainnet') return chainCap
  const sevenDays = Math.max(1, Math.ceil(SEVEN_DAYS_MS / epochDurationMs))
  return Math.max(1, Math.min(sevenDays, chainCap))
}

function proofExceedsChainCap(epoch: number, maxEpoch: number, maxEpochDelta: number | null): boolean {
  return maxEpoch > epoch + chainEpochCap(maxEpochDelta)
}

export function zkLoginProofExpiredOnChain(
  epoch: number,
  maxEpoch: number,
  maxEpochDelta: number | null,
): boolean {
  return epoch >= maxEpoch || proofExceedsChainCap(epoch, maxEpoch, maxEpochDelta)
}

export async function beginZkLogin(): Promise<{ nonce: string; state: string }> {
  setZkLoginProofRecovered(false)
  const ephemeral = new Ed25519Keypair()
  const randomness = generateRandomness()
  let clock: ChainClock
  try {
    clock = await chainClock()
  } catch {
    throw new Error('Could not reach the MySocial network. Try again in a moment.')
  }
  const maxEpoch = clock.epoch + horizonEpochs(clock.epochDurationMs, clock.maxEpochDelta)
  const nonce = generateNonce(ephemeral.getPublicKey(), maxEpoch, randomness)
  pending = { ephemeral, randomness, maxEpoch, nonce, clock }
  const state = crypto.randomUUID().replace(/-/g, '')
  sessionStorage.setItem(
    PENDING_KEY,
    JSON.stringify({
      secretKey: ephemeral.getSecretKey(),
      randomness,
      maxEpoch,
      nonce,
      state,
      clock,
    }),
  )
  return { nonce, state }
}

/** OAuth `state` and `nonce` issued by beginZkLogin, checked by the callback. */
export function zkLoginPendingRequest(): { state: string; nonce: string } | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(PENDING_KEY)
  if (!raw) return null
  try {
    const saved = JSON.parse(raw) as { state?: string; nonce?: string }
    if (!saved.state || !saved.nonce) return null
    return { state: saved.state, nonce: saved.nonce }
  } catch {
    return null
  }
}

function restorePending(): Pending | null {
  if (pending) return pending
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(PENDING_KEY)
  if (!raw) return null
  const saved = JSON.parse(raw) as {
    secretKey: string
    randomness: string
    maxEpoch: number
    nonce: string
    clock?: ChainClock
  }
  pending = {
    ephemeral: Ed25519Keypair.fromSecretKey(saved.secretKey),
    randomness: saved.randomness,
    maxEpoch: saved.maxEpoch,
    nonce: saved.nonce,
    clock: saved.clock && Number.isFinite(saved.clock.epoch) ? saved.clock : undefined,
  }
  return pending
}

async function saltFor(accessToken: string, iss: string, aud: string): Promise<string> {
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
  const existing = await fetch('/api/zklogin/salt', { headers })
  if (existing.ok) {
    const body = (await existing.json()) as { salt?: string }
    if (body.salt) return body.salt
  }
  const salt = BigInt(
    `0x${Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')}`,
  ).toString()
  const saved = await fetch('/api/zklogin/salt', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ salt, iss, aud }),
  })
  if (saved.status === 409) {
    const again = await fetch('/api/zklogin/salt', { headers })
    const body = (await again.json()) as { salt?: string }
    if (!body.salt) throw new Error('Could not store the zkLogin salt.')
    return body.salt
  }
  if (!saved.ok) throw new Error('Could not store the zkLogin salt.')
  return salt
}

function finishPending(): void {
  pending = null
  sessionStorage.removeItem(PENDING_KEY)
  localStorage.setItem(ACCOUNT_FLAG, '1')
}

async function saveCurrentSigner(decoded: DecodedJwt): Promise<void> {
  if (!current) return
  await saveZkLoginSigner(current.ephemeral.getSecretKey(), {
    address: current.address,
    addressSeed: current.addressSeed,
    maxEpoch: current.maxEpoch,
    proofPoints: current.proof.proofPoints,
    issBase64Details: current.proof.issBase64Details,
    headerBase64: current.proof.headerBase64,
    proofVersion: current.proof.proofVersion,
    sub: decoded.sub,
    ...proofScope(decoded),
  })
}

/** Resolves the zkLogin address for the OAuth id_token, reusing a valid on-device proof when it can. */
export async function completeZkLogin(input: { jwt: string; accessToken: string }): Promise<string> {
  const active = restorePending()
  if (!active) throw new Error('zkLogin nonce expired. Sign in again.')
  const decoded = decodeJwt(input.jwt)
  // `nonce` is in the payload but not on the SDK's JwtPayload type.
  if ((decoded as { nonce?: string }).nonce !== active.nonce) {
    throw new Error('OAuth token nonce does not match zkLogin.')
  }

  // Same OIDC subject with a still-valid on-device proof → skip salt + /prove entirely.
  setZkLoginProofRecovered(false)
  const reusedBySub = await reuseStoredProofForSubject(decoded)
  if (reusedBySub) {
    setZkLoginProofRecovered(true)
    finishPending()
    return reusedBySub
  }

  // Salt is only needed when we must derive the address or call the prover.
  const salt = await saltFor(input.accessToken, decoded.iss, decoded.aud)
  const addressSeed = genAddressSeed(salt, 'sub', decoded.sub, decoded.aud).toString()
  const address = jwtToAddress(input.jwt, salt, false)
  if (await reuseStoredProofForAddress(address, decoded)) {
    setZkLoginProofRecovered(true)
    finishPending()
    await saveCurrentSigner(decoded)
    return address
  }
  const prove = await fetch('/api/zklogin/prove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jwt: input.jwt,
      extendedEphemeralPublicKey: getExtendedEphemeralPublicKey(active.ephemeral.getPublicKey()),
      maxEpoch: active.maxEpoch,
      jwtRandomness: active.randomness,
      salt,
      addressSeed,
      issBase64Details: extractIssClaim(input.jwt),
      headerBase64: input.jwt.split('.')[0],
      keyClaimName: 'sub',
      network: zkLoginProverNetwork(getCurrentNetwork()),
    }),
  })
  if (!prove.ok) {
    const raw = await prove.text()
    let message = 'zkLogin prover could not build a proof.'
    try {
      const body = JSON.parse(raw) as { error?: string; message?: string; details?: string }
      message = body.error || body.message || body.details || message
    } catch {
      if (raw.trim()) message = raw.trim().slice(0, 240)
    }
    throw new Error(message)
  }
  const proof = normalizeProof((await prove.json()) as Parameters<typeof normalizeProof>[0], input.jwt)
  current = {
    ...active,
    address,
    addressSeed,
    proof,
  }
  finishPending()
  await saveCurrentSigner(decoded)
  return address
}

function proofScope(decoded: DecodedJwt): { network: string; iss: string; aud: string } {
  return {
    network: zkLoginProverNetwork(getCurrentNetwork()),
    iss: decoded.iss,
    aud: decoded.aud,
  }
}

/** A stored proof is only reusable for the network, issuer and client it was proven for. Older records carry none of these, so they are re-proved. */
function storedProofMatchesScope(record: ZkLoginRestoreRecord, decoded: DecodedJwt): boolean {
  const scope = proofScope(decoded)
  return record.network === scope.network && record.iss === scope.iss && record.aud === scope.aud
}

async function reuseStoredProofForSubject(decoded: DecodedJwt): Promise<string | null> {
  const loaded = await loadZkLoginSigner().catch(() => null)
  if (!loaded?.record.sub || loaded.record.sub !== decoded.sub) return null
  if (!storedProofMatchesScope(loaded.record, decoded)) return null
  if ((await activateLoadedProof(loaded)) !== 'ok') return null
  return loaded.record.address
}

async function reuseStoredProofForAddress(address: string, decoded: DecodedJwt): Promise<boolean> {
  const loaded = await loadZkLoginSigner().catch(() => null)
  if (!loaded) return false
  if (loaded.record.address.toLowerCase() !== address.toLowerCase()) return false
  if (!storedProofMatchesScope(loaded.record, decoded)) return false
  return (await activateLoadedProof(loaded)) === 'ok'
}

async function discardUnusableProof(): Promise<void> {
  current = null
  await clearZkLoginSigner()
  if (typeof window !== 'undefined') localStorage.removeItem(ACCOUNT_FLAG)
}

function notifyZkLoginProofExpired(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ZKLOGIN_PROOF_EXPIRED_EVENT))
}

async function activateLoadedProof(loaded: {
  secret: string
  record: ZkLoginRestoreRecord
}): Promise<ZkLoginRestoreStatus> {
  const clock = await chainClock().catch(() => null)
  const restoredProof = {
    proofPoints: loaded.record.proofPoints,
    issBase64Details: loaded.record.issBase64Details,
    headerBase64: loaded.record.headerBase64,
    proofVersion: loaded.record.proofVersion ?? 0,
  }
  if (!clock) return 'clock-unavailable'
  if (zkLoginProofExpiredOnChain(clock.epoch, loaded.record.maxEpoch, clock.maxEpochDelta)) {
    await discardUnusableProof()
    return 'expired'
  }
  if (!proofAcceptable(restoredProof)) {
    await discardUnusableProof()
    return 'invalid'
  }
  current = {
    ephemeral: Ed25519Keypair.fromSecretKey(loaded.secret),
    randomness: '',
    maxEpoch: loaded.record.maxEpoch,
    nonce: '',
    clock,
    address: loaded.record.address,
    addressSeed: loaded.record.addressSeed,
    proof: restoredProof,
  }
  if (typeof window !== 'undefined') localStorage.setItem(ACCOUNT_FLAG, '1')
  return 'ok'
}

export async function restoreZkLoginSignerStatus(): Promise<ZkLoginRestoreStatus> {
  if (zkLoginPending() && !current) return 'missing'
  if (current) {
    const clock = await chainClock().catch(() => null)
    if (!clock) return 'clock-unavailable'
    if (zkLoginProofExpiredOnChain(clock.epoch, current.maxEpoch, clock.maxEpochDelta)) {
      await discardUnusableProof()
      return 'expired'
    }
    if (!proofAcceptable(current.proof)) {
      await discardUnusableProof()
      return 'invalid'
    }
    return 'ok'
  }
  const loaded = await loadZkLoginSigner().catch(() => null)
  if (!loaded) return 'missing'
  return activateLoadedProof(loaded)
}

export async function restoreZkLoginSigner(): Promise<boolean> {
  return (await restoreZkLoginSignerStatus()) === 'ok'
}

export async function zkLoginUserSignature(txBytes: Uint8Array): Promise<string | null> {
  if (!current) {
    const restored = await restoreZkLoginSignerStatus()
    if (restored === 'expired' || restored === 'invalid' || restored === 'missing') {
      notifyZkLoginProofExpired()
      throw new Error('Sign in again to refresh zkLogin.')
    }
    if (restored !== 'ok' || !current) return null
  }
  let clock: ChainClock
  try {
    clock = await chainClock()
  } catch {
    throw new Error('Could not read the current epoch.')
  }
  if (zkLoginProofExpiredOnChain(clock.epoch, current.maxEpoch, clock.maxEpochDelta)) {
    await discardUnusableProof()
    notifyZkLoginProofExpired()
    throw new Error('Sign in again to refresh zkLogin.')
  }
  if (!proofAcceptable(current.proof)) {
    await discardUnusableProof()
    throw new Error('Sign in again to refresh zkLogin.')
  }
  const signed = await current.ephemeral.signTransaction(txBytes)
  return getZkLoginSignature({
    inputs: {
      proofPoints: current.proof.proofPoints,
      issBase64Details: current.proof.issBase64Details,
      headerBase64: current.proof.headerBase64,
      addressSeed: current.addressSeed,
    },
    maxEpoch: current.maxEpoch,
    userSignature: signed.signature,
  })
}
