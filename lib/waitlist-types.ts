export type WaitlistUserStatus = 'waiting' | 'approved' | 'none'

export interface WaitlistProgram {
  enabled: boolean
  active: boolean
  scheduledSunsetAt: string | null
  admissionIntervalHours: number | null
  spotsPerBatch: number | null
  referralBumpPoints: number
  referralsRequiredForCopy: number
  waitingCount?: number | null
  paused?: boolean
}

export interface WaitlistStatus {
  status: WaitlistUserStatus
  positionEstimate: number | null
  referralBumps: number
  nextBatchAt: string | null
  positionEstimateBatches: number
  referralCode: string | null
  batchAdmissionEnabled: boolean
  inviteBypassEnabled: boolean
  activeInviteCodesInCirculation: number | null
  paused: boolean
  programActive: boolean
  waitingCount: number | null
  spotsPerBatch: number | null
  admissionIntervalHours: number | null
  estimatedBatches: number | null
  referralBumpPoints: number
  referralStats: {
    referralCount: number
    referralsRequired: number
    thresholdReached: boolean
  } | null
  shareUrl: string | null
  scheduledSunsetAt: string | null
}

export interface OnboardResult {
  referralCode: string
  waitlistStatus: WaitlistUserStatus | null
  inviteApproved?: boolean
  referral?: {
    inserted: boolean
    bumpApplied: boolean
  } | null
}

export interface InvitePreview {
  inviteCode: string
  status: string
  expired: boolean
  expiresAt: string | null
}

export interface InviteCode {
  inviteId: string
  inviteCode: string
  inviteeWallet: string | null
  status: string
  expiresAt: string | null
  createdAt: string
  acceptedAt: string | null
  inviterWallet?: string
}

export const MAX_INVITES_PER_USER = 10
