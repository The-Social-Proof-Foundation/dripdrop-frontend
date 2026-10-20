/**
 * True while zkLogin OAuth returned and prove/bind is still finishing.
 * Drives the sign-in overlay before the session is stored, since the session
 * is only written once its JWT can auth the API.
 */

type Listener = () => void

const listeners = new Set<Listener>()
let busy = false

export function zkLoginAuthBusy(): boolean {
  return busy
}

export function subscribeZkLoginAuthBusy(onStoreChange: Listener): () => void {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function setZkLoginAuthBusy(next: boolean): void {
  if (busy === next) return
  busy = next
  listeners.forEach((listener) => listener())
}

/** True when the current sign-in reused the on-device proof instead of calling the prover. */
let proofRecovered = false

export function zkLoginProofRecovered(): boolean {
  return proofRecovered
}

export function setZkLoginProofRecovered(next: boolean): void {
  if (proofRecovered === next) return
  proofRecovered = next
  listeners.forEach((listener) => listener())
}
