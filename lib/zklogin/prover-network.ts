import type { NetworkType } from '@/lib/network-utils'
import { getCurrentNetwork } from '@/lib/network-utils'

/**
 * Network label sent to the zkLogin prover. Local fullnodes use testnet ceremony params;
 * the prover service expects `testnet` even when the wallet UI is on localnet.
 */
export function zkLoginProverNetwork(chainNetwork?: NetworkType): NetworkType {
  const fromEnv = process.env.NEXT_PUBLIC_ZKLOGIN_PROVER_NETWORK ?? process.env.ZKLOGIN_PROVER_NETWORK
  if (fromEnv === 'mainnet' || fromEnv === 'testnet' || fromEnv === 'localnet') {
    return fromEnv
  }
  const chain = chainNetwork ?? getCurrentNetwork()
  if (chain === 'localnet') return 'testnet'
  return chain
}
