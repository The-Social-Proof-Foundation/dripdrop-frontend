import { NextResponse } from 'next/server'

export async function GET() {
  const envStatus = {
    resendApiKey: !!process.env.RESEND_API_KEY,
    resendFromEmail: !!process.env.RESEND_FROM_EMAIL,
    resendFromName: !!process.env.RESEND_FROM_NAME,
    resendAudienceId: !!process.env.RESEND_AUDIENCE_ID,
    baseUrl: !!process.env.NEXT_PUBLIC_BASE_URL,
    dripdropApiUrl: !!(process.env.DRIPDROP_API_URL || process.env.NEXT_PUBLIC_DRIPDROP_API_URL),
    mysocialAuthHost: !!process.env.NEXT_PUBLIC_MYSOCIAL_AUTH_HOST,
    mysocialSaltUrl: !!process.env.NEXT_PUBLIC_MYSOCIAL_SALT_URL,
    authClientId: !!process.env.NEXT_PUBLIC_AUTH_CLIENT_ID,
  }

  const allConfigured = Object.values(envStatus).every(Boolean)

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    envConfigStatus: envStatus,
    allEnvConfigured: allConfigured,
    message: allConfigured 
      ? 'All environment variables are configured' 
      : 'Some environment variables are missing'
  })
} 