/**
 * Set when Sign In starts. Survives the OAuth redirect, then this tab consumes it.
 * A normal visit never sets it, so session hydration does not replay the overlay.
 */

const LOGIN_CELEBRATION_KEY = 'mysocial-login-celebration'

type Listener = () => void

const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach((listener) => listener())
}

export function loginCelebrationPending(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  try {
    return sessionStorage.getItem(LOGIN_CELEBRATION_KEY) === '1'
  } catch {
    return false
  }
}

export function subscribeLoginCelebration(onStoreChange: Listener): () => void {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function markLoginCelebration(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(LOGIN_CELEBRATION_KEY, '1')
  } catch {
    // ignore quota / private mode
  }
  notify()
}

export function clearLoginCelebration(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(LOGIN_CELEBRATION_KEY)
  } catch {
    // ignore
  }
  notify()
}
