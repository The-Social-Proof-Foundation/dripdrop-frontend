'use server'

import { Resend } from 'resend'

// Resend utilities for audience management and transactional emails
// Handles adding users to audiences AND sending welcome emails

// Contact management interfaces
export interface ResendContact {
  email: string
  firstName?: string
  lastName?: string
  unsubscribed?: boolean
}

export interface ResendContactResponse {
  success: boolean
  message: string
  contactId?: string
}

// Welcome email interfaces  
export interface WelcomeEmailData {
  email: string
  firstName?: string
  lastName?: string
  fullName?: string
}

export interface ResendEmailResponse {
  success: boolean
  message: string
  messageId?: string
}

// Combined response for both actions
export interface ResendCombinedResponse {
  contactAdded: ResendContactResponse
  emailSent: ResendEmailResponse
  overallSuccess: boolean
}

// Initialize Resend client only when API key is available
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

// Check if a contact exists in Resend audience
export async function checkContactExists(email: string, audienceId?: string): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured')
      return false
    }

    if (!audienceId) {
      console.warn('⚠️ No audience ID provided, skipping contact check')
      return false
    }

    // Get contact from audience
    const resend = getResendClient()
    const contact = await resend.contacts.get({
      email,
      audienceId
    })

    return !!contact?.data
    
  } catch (error) {
    console.error('❌ Error checking contact existence:', error)
    return false // Assume doesn't exist if check fails
  }
}

// Add contact to Resend audience
export async function addContactToResend(
  contact: ResendContact, 
  audienceId?: string
): Promise<ResendContactResponse> {
  try {
    // Check if we have required API key
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured, skipping contact addition')
      return {
        success: false,
        message: 'Resend API key not configured'
      }
    }

    if (!audienceId) {
      console.warn('⚠️ No audience ID provided, skipping contact addition')
      return {
        success: false,
        message: 'Audience ID not configured'
      }
    }

    console.log('📝 Adding contact to Resend audience:', audienceId)

    // Add contact to Resend audience
    const resend = getResendClient()
    const result = await resend.contacts.create({
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      unsubscribed: contact.unsubscribed || false,
      audienceId
    })

    if (result.error) {
      console.error('❌ Resend contact API error:', result.error)
      throw new Error(`Resend contact API error: ${result.error.message}`)
    }

    return { 
      success: true, 
      message: 'Successfully added to audience!',
      contactId: result.data?.id 
    }
    
  } catch (error) {
    console.error('❌ Resend contact addition error:', error)
    return { 
      success: false, 
      message: `Failed to add to audience: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

// Smart contact addition - checks existence first, then adds if needed
export async function smartAddContactToResend(
  contact: ResendContact,
  audienceId?: string
): Promise<ResendContactResponse> {
  try {
    // If no audience ID, skip contact management
    if (!audienceId) {
      return {
        success: true,
        message: 'No audience configured - contact management skipped'
      }
    }

    // Check if contact already exists
    const contactExists = await checkContactExists(contact.email, audienceId)
    
    if (contactExists) {
      return {
        success: true,
        message: 'Already in audience!'
      }
    }
    
    // Contact doesn't exist, add them
    return await addContactToResend(contact, audienceId)
    
  } catch (error) {
    console.error('Smart contact addition error:', error)
    return {
      success: false,
      message: 'Failed to process contact addition. Please try again.'
    }
  }
}

// Send welcome email using Resend
export async function sendWelcomeEmail(
  emailData: WelcomeEmailData
): Promise<ResendEmailResponse> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured, skipping email')
      return {
        success: false,
        message: 'Resend API key not configured'
      }
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'brandon@dripdrop.social'
    const fromName = process.env.RESEND_FROM_NAME || 'DripDrop'

    // Send welcome email
    const resend = getResendClient()
    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [emailData.email],
      subject: 'Welcome to DripDrop - Get Started Today!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to DripDrop</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to DripDrop!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${emailData.firstName || 'there'}!</h2>
            
            <p>Thank you for joining DripDrop! We're thrilled to have you as part of our growing community.</p>
            
            <p><strong>What's next?</strong></p>
            <ul>
              <li>Complete your profile to connect with others</li>
              <li>Explore the DripDrop ecosystem</li>
              <li>Start building your decentralized social presence</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://dripdrop.social'}/wallet" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Get Started Now
              </a>
            </div>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Best regards,<br>
            <strong>The DripDrop Team</strong></p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #666;">
              This email was sent to ${emailData.email} because you signed up for DripDrop.<br>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://dripdrop.social'}/unsubscribe?email=${encodeURIComponent(emailData.email)}" 
                 style="color: #667eea;">Unsubscribe</a> | 
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://dripdrop.social'}/privacy" 
                 style="color: #667eea;">Privacy Policy</a>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to DripDrop, ${emailData.firstName || 'there'}!

Thank you for joining DripDrop! We're thrilled to have you as part of our growing community.

What's next?
- Complete your profile to connect with others
- Explore the DripDrop ecosystem  
- Start building your decentralized social presence

Get started: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://dripdrop.social'}/wallet

If you have any questions, feel free to reach out to our support team.

Best regards,
The DripDrop Team

---
This email was sent to ${emailData.email} because you signed up for DripDrop.
Unsubscribe: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://dripdrop.social'}/unsubscribe?email=${encodeURIComponent(emailData.email)}
Privacy Policy: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://dripdrop.social'}/privacy
      `.trim()
    })

    if (result.error) {
      console.error('Resend email API error:', result.error)
      throw new Error(`Resend email API error: ${result.error.message}`)
    }

    return { 
      success: true, 
      message: 'Welcome email sent successfully!',
      messageId: result.data?.id
    }
    
  } catch (error) {
    console.error('Resend welcome email error:', error)
    return { 
      success: false, 
      message: 'Failed to send welcome email. Please try again.' 
    }
  }
}

// Combined function: Add to audience AND send welcome email
export async function addContactAndSendWelcomeEmail(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<ResendCombinedResponse> {
  
  // Prepare contact data
  const contact: ResendContact = {
    email,
    firstName,
    lastName,
    unsubscribed: false
  }

  // Prepare email data
  const emailData: WelcomeEmailData = {
    email,
    firstName,
    lastName,
    fullName: `${firstName || ''} ${lastName || ''}`.trim() || undefined
  }

  // Use environment variable for audience ID
  const audienceId = process.env.RESEND_AUDIENCE_ID

  // Execute contact addition first (optional feature)
  const contactResult = await smartAddContactToResend(contact, audienceId)

  // Send welcome email
  const emailResult = await sendWelcomeEmail(emailData)

  // Consider the process successful if at least the email was sent
  // Contact addition is nice-to-have but not critical for user experience
  return {
    contactAdded: contactResult,
    emailSent: emailResult,
    overallSuccess: emailResult.success // Focus on email success as primary goal
  }
}

// Main export function for compatibility
export async function processEmailSignup(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<ResendCombinedResponse> {
  return await addContactAndSendWelcomeEmail(email, firstName, lastName)
}