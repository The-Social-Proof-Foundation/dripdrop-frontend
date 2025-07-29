import { NextRequest, NextResponse } from 'next/server'
import { addContactAndSendWelcomeEmail } from '@/lib/sendgrid'

// Rate limiting map (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 5 // requests per window
const RATE_WINDOW = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return false
  }
  
  userLimit.count++
  return true
}

function sanitizeInput(input: string): string {
  return input.trim().toLowerCase()
}

function validateEmail(email: string): boolean {
  // More robust email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email) && email.length <= 254
}

function validateName(name: string): boolean {
  return name.length <= 50 && /^[a-zA-Z\s'-]+$/.test(name)
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  
  console.log(`📧 Email signup request from IP: ${ip}`)
  
  // Environment check for production readiness
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.error('❌ Missing required environment variables for email service')
    return NextResponse.json(
      { error: 'Email service not configured' },
      { status: 503 }
    )
  }
  
  try {
    // Rate limiting
    if (!checkRateLimit(ip)) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    let body: any
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('Invalid JSON payload:', parseError)
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    const { email, firstName, lastName } = body

    // Validate required fields
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Sanitize and validate email
    const cleanEmail = sanitizeInput(email)
    if (!validateEmail(cleanEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate optional name fields
    let cleanFirstName = ''
    let cleanLastName = ''
    
    if (firstName && typeof firstName === 'string') {
      cleanFirstName = firstName.trim()
      if (cleanFirstName && !validateName(cleanFirstName)) {
        return NextResponse.json(
          { error: 'Invalid first name format' },
          { status: 400 }
        )
      }
    }
    
    if (lastName && typeof lastName === 'string') {
      cleanLastName = lastName.trim()
      if (cleanLastName && !validateName(cleanLastName)) {
        return NextResponse.json(
          { error: 'Invalid last name format' },
          { status: 400 }
        )
      }
    }

    // Call the sendgrid function with timeout
    console.log(`📤 Processing signup for: ${cleanEmail}`)
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 30000)
    )
    
    const result = await Promise.race([
      addContactAndSendWelcomeEmail(cleanEmail, cleanFirstName || undefined, cleanLastName || undefined),
      timeoutPromise
    ]) as any

    const processingTime = Date.now() - startTime
    console.log(`⚡ Request processed in ${processingTime}ms`)

    // Validate response structure
    if (!result || typeof result.overallSuccess !== 'boolean') {
      console.error('Invalid response from sendgrid function:', result)
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    if (result.overallSuccess) {
      console.log(`✅ Successfully processed signup for: ${cleanEmail}`)
      return NextResponse.json({
        success: true,
        message: 'Successfully subscribed!'
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Response-Time': `${processingTime}ms`,
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        }
      })
    } else {
      // Log detailed error but don't expose to client
      console.error('Signup processing failed:', {
        email: cleanEmail,
        contactAdded: result.contactAdded?.success || false,
        contactMessage: result.contactAdded?.message || 'unknown',
        emailSent: result.emailSent?.success || false,
        emailMessage: result.emailSent?.message || 'unknown'
      })
      
      return NextResponse.json(
        { error: 'Unable to complete signup. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    
    if (error instanceof Error && error.message === 'Request timeout') {
      console.error(`⏰ Request timeout after ${processingTime}ms for IP: ${ip}`)
      return NextResponse.json(
        { error: 'Request timeout. Please try again.' },
        { status: 408 }
      )
    }
    
    console.error('Email signup API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip,
      processingTime
    })
    
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 500 }
    )
  }
}

// Handle CORS and preflight requests
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin')
  const allowedOrigins = [
    'https://dripdrop.social',
    'https://www.dripdrop.social',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ]
  
  // In development, allow localhost. In production, restrict to your domains
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isAllowedOrigin = isDevelopment ? 
    (origin?.includes('localhost') || allowedOrigins.includes(origin || '')) :
    allowedOrigins.includes(origin || '')
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': isAllowedOrigin ? (origin || '*') : 'https://dripdrop.social',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
      'Vary': 'Origin',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    },
  })
} 