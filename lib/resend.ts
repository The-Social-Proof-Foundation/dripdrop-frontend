'use server'

import { Resend } from 'resend'
import { render } from '@react-email/render'
import { WelcomeEmail } from '@/components/email-templates'

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
    // const contactExists = await checkContactExists(contact.email, audienceId)
    
    // if (contactExists) {
    //   return {
    //     success: true,
    //     message: 'Already in audience!'
    //   }
    // }
    
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

    // Render React Email template to HTML
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dripdrop.social'
    const emailHtml = await render(WelcomeEmail({
      firstName: emailData.firstName,
      email: emailData.email,
      baseUrl
    }))

    // Send welcome email
    const resend = getResendClient()
    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [emailData.email],
      subject: 'Welcome to DripDrop! - TestFlight Invites Coming Soon',
      html: emailHtml,
      text: `Welcome to DripDrop!

Thank you for joining DripDrop! We're thrilled to have you as part of our growing community building the future of decentralized social networking.

You've successfully reserved your spot for the TestFlight beta. Here's what happens next:

📱 TestFlight Invite: You'll receive your beta access TestFlight email
🌐 Decentralized Social: Connect without centralized control
🔐 Own Your Data: Your content, your rules, your ownership
💫 MySocial Network: Part of the larger decentralized ecosystem

While you wait for your TestFlight invite, follow us on social media for the latest updates and sneak peeks of what's coming:

- X (Twitter): https://x.com/dripdrop_social
- Telegram: https://t.me/dripdrop_social

Questions? Feel free to reach out to us on X or Telegram.

Talk soon,
The DripDrop Team

---
This email was sent to ${emailData.email} because you signed up for DripDrop TestFlight access.
Unsubscribe: ${baseUrl}/unsubscribe?email=${encodeURIComponent(emailData.email)}
Privacy Policy: ${baseUrl}/privacy
dripdrop.social`
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