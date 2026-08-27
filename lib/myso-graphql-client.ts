import { MySoGraphQLClient } from '@socialproof/myso/graphql'
import Cookies from 'js-cookie'
import type { NetworkType } from '@/lib/network-utils'

let graphqlClient: MySoGraphQLClient | null = null
let cachedNetwork: NetworkType | null = null

const DEFAULT_GRAPHQL_MAINNET = 'https://graphql.mainnet.mysocial.network/graphql'
const DEFAULT_GRAPHQL_TESTNET = 'https://graphql.testnet.mysocial.network/graphql'
const DEFAULT_GRAPHQL_LOCALNET = 'http://127.0.0.1:9125/graphql'

export function getGraphQLEndpointForNetwork(network: NetworkType): string {
  switch (network) {
    case 'mainnet':
      return process.env.NEXT_PUBLIC_GRAPHQL_MAINNET_URL || DEFAULT_GRAPHQL_MAINNET
    case 'testnet':
      return (
        process.env.NEXT_PUBLIC_GRAPHQL_TESTNET_URL ||
        process.env.NEXT_PUBLIC_GRAPHQL_URL ||
        DEFAULT_GRAPHQL_TESTNET
      )
    case 'localnet':
      return process.env.NEXT_PUBLIC_GRAPHQL_LOCALNET_URL || DEFAULT_GRAPHQL_LOCALNET
    default:
      return DEFAULT_GRAPHQL_LOCALNET
  }
}

export function getGraphQLEndpoint(): string {
  const network = Cookies.get('selectedNetwork') || 'testnet'
  if (network === 'mainnet' || network === 'testnet' || network === 'localnet') {
    return getGraphQLEndpointForNetwork(network)
  }
  return getGraphQLEndpointForNetwork('testnet')
}

function toSdkNetwork(network: NetworkType): 'mainnet' | 'testnet' | 'localnet' {
  return network
}

const noCacheFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers)
  headers.set('Cache-Control', 'no-cache')
  headers.set('Pragma', 'no-cache')
  return fetch(input, { ...init, cache: 'no-store', headers })
}

export function createMySoGraphQLClient(network: NetworkType): MySoGraphQLClient {
  const url = getGraphQLEndpointForNetwork(network)
  return new MySoGraphQLClient({
    url,
    network: toSdkNetwork(network),
    fetch: noCacheFetch,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })
}

function getNetworkFromCookies(): NetworkType {
  const saved = Cookies.get('selectedNetwork')
  if (saved === 'mainnet' || saved === 'testnet' || saved === 'localnet') {
    return saved
  }
  return 'testnet'
}

export function getMySoGraphQLClient(network?: NetworkType): MySoGraphQLClient {
  const currentNetwork = network ?? getNetworkFromCookies()

  if (graphqlClient && cachedNetwork === currentNetwork) {
    return graphqlClient
  }

  graphqlClient = createMySoGraphQLClient(currentNetwork)
  cachedNetwork = currentNetwork
  return graphqlClient
}

export function resetMySoGraphQLClient(): void {
  graphqlClient = null
  cachedNetwork = null
}
