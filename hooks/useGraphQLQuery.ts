'use client'

import { useQuery } from '@tanstack/react-query'
import type { DocumentNode } from 'graphql'
import { print } from 'graphql'
import { useNetwork } from '@/lib/network-context'
import { getMySoGraphQLClient } from '@/lib/myso-graphql-client'

function isGraphqlDebugEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_DEBUG_GRAPHQL === 'true'
  )
}

function graphqlOperationLabel(document: DocumentNode): string {
  const line =
    print(document)
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !l.startsWith('#')) ?? ''
  return line.length > 120 ? `${line.slice(0, 117)}…` : line
}

export interface UseGraphQLQueryOptions<TData = unknown, TVariables = Record<string, unknown>> {
  query: DocumentNode | null | undefined
  variables?: TVariables
  enabled?: boolean
  skip?: boolean
  refetchInterval?: number
  staleTime?: number
  gcTime?: number
  refetchOnWindowFocus?: boolean
}

export function useGraphQLQuery<TData = unknown, TVariables = Record<string, unknown>>(
  options: UseGraphQLQueryOptions<TData, TVariables>,
) {
  const {
    query,
    variables,
    enabled = true,
    skip = false,
    refetchInterval,
    staleTime = 60_000,
    gcTime,
    refetchOnWindowFocus,
  } = options
  const { currentNetwork, isNetworkHydrated } = useNetwork()

  const isEnabled = enabled && !skip && !!query && isNetworkHydrated
  const queryKeyDocument = query ? print(query) : 'skipped'

  const { data, isLoading, isFetching, error, refetch, isSuccess, isFetched } = useQuery({
    queryKey: ['graphql', currentNetwork, queryKeyDocument, variables],
    queryFn: async () => {
      if (!query) {
        throw new Error('GraphQL query document is missing')
      }
      const client = getMySoGraphQLClient(currentNetwork)
      const result = await client.query({
        query,
        variables: variables as Record<string, unknown>,
      })

      if (isGraphqlDebugEnabled()) {
        console.groupCollapsed(`[GraphQL] ${graphqlOperationLabel(query)}`)
        console.log('network', currentNetwork)
        console.log('variables', variables)
        console.log('data', result.data)
        if (result.errors?.length) {
          console.warn('errors', result.errors)
        }
        console.groupEnd()
      }

      if (result.errors && result.errors.length > 0) {
        const errMsg = result.errors.map((e) => e.message).join('; ')
        const label = graphqlOperationLabel(query)
        if (process.env.NODE_ENV === 'development') {
          console.error(`[GraphQL] ${label}: ${errMsg}`, result.errors[0])
        }
        throw new Error(`GraphQL error (${label}): ${errMsg}`)
      }

      return result.data as TData
    },
    enabled: isEnabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    refetchInterval,
  })

  return {
    data,
    loading: isLoading,
    isFetching,
    error: error ?? undefined,
    refetch,
    isSuccess,
    isFetched,
  }
}
