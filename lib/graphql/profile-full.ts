import gql from 'graphql-tag'

/** Single round-trip profile for auth / nav (no holdings, posts, or PnL). */
export const PROFILE_FULL = gql`
  query ProfileFull($address: MySoAddress!) {
    profile(address: $address) {
      id
      address
      username
      displayName
      bio
      profilePhoto
      coverPhoto
      website
      createdAt
      updatedAt
      profileId
      followersCount
      followingCount
      postCount
      birthdate
      location
      xUsername
      blockListAddress
      socialProofTokenAddress
      reservationPoolAddress
      socialProofToken {
        totalReserved
        requiredThreshold
        reservationPercentage
      }
    }
  }
`

export type ProfileFullQueryData = {
  profile?: Record<string, unknown> | null
}

export type ProfileFullVariables = {
  address: string
}

export const PROFILE_FULL_STALE_MS = 300_000
