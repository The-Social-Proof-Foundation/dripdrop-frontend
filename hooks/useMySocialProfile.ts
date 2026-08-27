'use client'

import { useMemo } from 'react'
import {
  PROFILE_FULL,
  PROFILE_FULL_STALE_MS,
  type ProfileFullQueryData,
} from '@/lib/graphql/profile-full'
import { mapGraphqlProfileToMySocial } from '@/lib/profile-graphql'
import { useGraphQLQuery } from '@/hooks/useGraphQLQuery'
import { useNetwork } from '@/lib/network-context'

export function useMySocialProfile(address: string | null | undefined) {
  const { isNetworkHydrated } = useNetwork()

  const {
    data,
    loading,
    error,
    refetch,
    isSuccess,
    isFetched,
  } = useGraphQLQuery<ProfileFullQueryData, { address: string }>({
    query: PROFILE_FULL,
    variables: address ? { address } : { address: '' },
    skip: !address || !isNetworkHydrated,
    staleTime: PROFILE_FULL_STALE_MS,
    refetchOnWindowFocus: true,
  })

  const profile = useMemo(
    () => mapGraphqlProfileToMySocial(data?.profile),
    [data?.profile],
  )

  return {
    profile,
    hasProfile: profile != null,
    isLoading: !!address && (!isNetworkHydrated || loading),
    isFetched: isFetched && isNetworkHydrated,
    isSuccess,
    error,
    refetch,
    needsProfileCreation: !!address && isSuccess && profile == null,
  }
}
