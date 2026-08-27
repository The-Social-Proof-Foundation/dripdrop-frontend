function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function generatePkce(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const codeVerifier = base64UrlEncode(bytes)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
  const codeChallenge = base64UrlEncode(new Uint8Array(digest))
  return { codeVerifier, codeChallenge }
}

export function randomUrlSafeValue(byteCount = 32): string {
  const bytes = new Uint8Array(byteCount)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}
