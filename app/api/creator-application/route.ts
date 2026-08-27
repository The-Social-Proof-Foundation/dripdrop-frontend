import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

interface CreatorApplicationBody {
  walletAddress?: string
  email?: string | null
  displayName?: string
  socialLink?: string
  niche?: string
  pitch?: string
  audienceSize?: string
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
  }

  const toEmail =
    process.env.CREATOR_APPLY_TO_EMAIL ||
    process.env.RESEND_FROM_EMAIL

  let body: CreatorApplicationBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const displayName = body.displayName?.trim()
  const socialLink = body.socialLink?.trim()
  const niche = body.niche?.trim()
  const pitch = body.pitch?.trim()
  const walletAddress = body.walletAddress?.trim()

  if (!displayName || !socialLink || !niche || !pitch || !walletAddress) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!isValidUrl(socialLink)) {
    return NextResponse.json({ error: 'Invalid social link URL' }, { status: 400 })
  }

  if (displayName.length > 80 || niche.length > 80 || pitch.length > 2000) {
    return NextResponse.json({ error: 'Field length exceeded' }, { status: 400 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromName = process.env.RESEND_FROM_NAME || 'DripDrop'

  const text = [
    'New DripDrop creator application',
    '',
    `Wallet: ${walletAddress}`,
    `Email: ${body.email || '—'}`,
    `Display name: ${displayName}`,
    `Social link: ${socialLink}`,
    `Niche: ${niche}`,
    `Audience size: ${body.audienceSize?.trim() || '—'}`,
    '',
    'Pitch:',
    pitch,
  ].join('\n')

  const { error } = await resend.emails.send({
    from: `${fromName} <${process.env.RESEND_FROM_EMAIL}>`,
    to: [toEmail],
    subject: `Creator application: ${displayName}`,
    text,
  })

  if (error) {
    console.error('Creator application email failed:', error)
    return NextResponse.json({ error: 'Failed to send application' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
