/**
 * Network detection utilities
 * Works in both client-side and server-side contexts
 */

export type NetworkType = 'mainnet' | 'testnet' | 'localnet'

/**
 * Get the current network from cookies (client-side).
 * Defaults to testnet to match OAuth host (auth.testnet.mysocial.network).
 */
export function getCurrentNetwork(): NetworkType {
  if (typeof window !== 'undefined') {
    try {
      const Cookies = require('js-cookie')
      const savedNetwork = Cookies.get('selectedNetwork')
      if (savedNetwork === 'mainnet' || savedNetwork === 'testnet' || savedNetwork === 'localnet') {
        return savedNetwork
      }
    } catch (error) {
      console.warn('Failed to read network from cookies (client-side):', error)
    }
  }

  return 'testnet'
}

/**
 * Get current network from cookies string (server-side).
 */
export function getCurrentNetworkFromCookies(cookieHeader: string | null | undefined): NetworkType {
  if (!cookieHeader) {
    return 'testnet'
  }

  const cookies: Record<string, string> = {}
  cookieHeader.split(';').forEach((cookie) => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookies[name] = decodeURIComponent(value)
    }
  })

  const savedNetwork = cookies['selectedNetwork']
  if (savedNetwork === 'mainnet' || savedNetwork === 'testnet' || savedNetwork === 'localnet') {
    return savedNetwork
  }

  return 'testnet'
}
