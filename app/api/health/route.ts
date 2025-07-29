import { NextResponse } from 'next/server'

export async function GET() {
  const envStatus = {
    sendgridApiKey: !!process.env.SENDGRID_API_KEY,
    sendgridFromEmail: !!process.env.SENDGRID_FROM_EMAIL,
    sendgridFromName: !!process.env.SENDGRID_FROM_NAME,
    sendgridContactListId: !!process.env.SENDGRID_CONTACT_LIST_ID,
    sendgridWelcomeTemplateId: !!process.env.SENDGRID_WELCOME_TEMPLATE_ID,
    baseUrl: !!process.env.NEXT_PUBLIC_BASE_URL,
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