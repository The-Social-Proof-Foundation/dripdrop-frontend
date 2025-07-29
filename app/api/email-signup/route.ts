import { NextRequest, NextResponse } from 'next/server'
import { addContactAndSendWelcomeEmail } from '@/lib/sendgrid'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, firstName, lastName } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Call the sendgrid function
    const result = await addContactAndSendWelcomeEmail(email, firstName, lastName)

    if (result.overallSuccess) {
      return NextResponse.json({
        success: true,
        message: 'Successfully subscribed!',
        contactAdded: result.contactAdded.success,
        emailSent: result.emailSent.success
      })
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to process signup',
          details: {
            contactAdded: result.contactAdded.message,
            emailSent: result.emailSent.message
          }
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Email signup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle CORS for production
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 