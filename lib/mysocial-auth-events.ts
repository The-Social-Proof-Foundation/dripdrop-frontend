export const MYSOCIAL_AUTH_CHANGED_EVENT = 'mysocial-auth-changed'

export function notifyAuthChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(MYSOCIAL_AUTH_CHANGED_EVENT))
  }
}
