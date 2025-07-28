'use server'

// SendGrid utilities for both contact management and transactional emails
// Handles adding users to contact lists AND sending welcome emails

// Contact management interfaces
export interface SendGridContact {
  email: string
  first_name?: string
  last_name?: string
  custom_fields?: Record<string, any>
}

export interface SendGridContactResponse {
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

export interface SendGridEmailResponse {
  success: boolean
  message: string
  messageId?: string
}

// Combined response for both actions
export interface SendGridCombinedResponse {
  contactAdded: SendGridContactResponse
  emailSent: SendGridEmailResponse
  overallSuccess: boolean
}

// Check if a contact exists in SendGrid
export async function checkContactExists(email: string): Promise<boolean> {
  try {
    const url = `https://api.sendgrid.com/v3/marketing/contacts/search/emails`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emails: [email]
      })
    })

    if (!response.ok) {
      return false // Assume doesn't exist if check fails
    }

    const data = await response.json()
    
    // Check if any contacts were found
    return data.result && Object.keys(data.result).length > 0
    
  } catch (error) {
    console.error('❌ Error checking contact existence:', error)
    return false // Assume doesn't exist if check fails
  }
}

// Add contact to SendGrid (with optional list ID)
export async function addContactToSendGrid(
  contact: SendGridContact, 
  listId?: string
): Promise<SendGridContactResponse> {
  try {
    // Check if we have required API key
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('⚠️ SENDGRID_API_KEY not configured, skipping contact addition')
      return {
        success: false,
        message: 'SendGrid API key not configured'
      }
    }

    const url = 'https://api.sendgrid.com/v3/marketing/contacts'

    // Add contact to SendGrid list

    // Prepare contact data
    const contactData: any = {
      contacts: [contact]
    }

    // Add list ID if specified
    if (listId) {
      contactData.list_ids = [listId]
      console.log('📝 Adding to specific list:', listId)
    } else {
      console.log('📝 Adding to default contact list (no specific list ID)')
    }

    console.log('📤 Full request payload:', JSON.stringify(contactData, null, 2))

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    })

    let responseData
    try {
      responseData = await response.json()
    } catch (parseError) {
      const textResponse = await response.text()
      throw new Error(`Invalid JSON response from SendGrid: ${textResponse}`)
    }

    if (!response.ok) {
      const errorDetails = responseData?.errors ? JSON.stringify(responseData.errors, null, 2) : 'No error details provided'
      console.error('❌ SendGrid API error details:', errorDetails)
      
      // Handle specific error cases
      if (response.status === 403) {
        const permissionError = 'SendGrid API key lacks contact management permissions. Please update your API key scopes to include "Marketing Permissions" in SendGrid dashboard.'
        console.error('❌ Permission Error:', permissionError)
        return {
          success: false,
          message: permissionError
        }
      }
      
      throw new Error(`SendGrid contact API error: ${response.status} - ${errorDetails}`)
    }

    return { 
      success: true, 
      message: 'Successfully added to contact list!',
      contactId: responseData.job_id 
    }
    
  } catch (error) {
    console.error('❌ SendGrid contact addition error:', error)
    return { 
      success: false, 
      message: `Failed to add to contact list: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

// Smart contact addition - checks existence first, then adds if needed
export async function smartAddContactToSendGrid(
  contact: SendGridContact,
  listId?: string
): Promise<SendGridContactResponse> {
  try {
    // Check if contact already exists
    const contactExists = await checkContactExists(contact.email)
    
    if (contactExists) {
      return {
        success: true,
        message: 'Already in contact list!'
      }
    }
    
    // Contact doesn't exist, add them
    return await addContactToSendGrid(contact, listId)
    
  } catch (error) {
    console.error('Smart contact addition error:', error)
    return {
      success: false,
      message: 'Failed to process contact addition. Please try again.'
    }
  }
}

// Send welcome email using SendGrid template
export async function sendWelcomeEmail(
  emailData: WelcomeEmailData,
  templateId?: string
): Promise<SendGridEmailResponse> {
  try {
    const url = 'https://api.sendgrid.com/v3/mail/send'

    // Send welcome email

    // Prepare email data with anti-spam headers
    const emailPayload = {
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'brandon@mysocial.network',
        name: process.env.SENDGRID_FROM_NAME || 'MySocial'
      },
      personalizations: [
        {
          to: [
            {
              email: emailData.email,
              name: emailData.fullName || `${emailData.firstName || ''} ${emailData.lastName || ''}`.trim() || emailData.email
            }
          ],
          dynamic_template_data: {
            first_name: emailData.firstName || 'there',
            last_name: emailData.lastName || '',
            full_name: emailData.fullName || `${emailData.firstName || ''} ${emailData.lastName || ''}`.trim() || 'there',
            email: emailData.email,
            signup_date: new Date().toLocaleDateString(),
            signup_timestamp: new Date().toISOString(),
            unsubscribe_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://mysocial.network'}/unsubscribe?email=${encodeURIComponent(emailData.email)}`
          }
        }
      ],
      // Add headers to improve deliverability
      headers: {
        'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_BASE_URL || 'https://mysocial.network'}/unsubscribe?email=${encodeURIComponent(emailData.email)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal'
      },
      // Add tracking settings
      tracking_settings: {
        click_tracking: {
          enable: true,
          enable_text: false
        },
        open_tracking: {
          enable: true
        },
        subscription_tracking: {
          enable: true
        }
      }
    }

    // Add template ID if provided
    if (templateId) {
      (emailPayload as any).template_id = templateId
    } else {
      // Fallback to basic email content if no template
      (emailPayload as any).subject = 'Welcome to MySocial - Get Started Today!'
      ;(emailPayload as any).content = [
        {
          type: 'text/html',
          value: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to MySocial</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">Welcome to MySocial!</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Hello ${emailData.firstName || 'there'}!</h2>
                
                <p>Thank you for joining MySocial using your Google account. We're thrilled to have you as part of our growing community!</p>
                
                <p><strong>What's next?</strong></p>
                <ul>
                  <li>Complete your profile to connect with others</li>
                  <li>Explore the MySocial ecosystem</li>
                  <li>Start building your decentralized social presence</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://mysocial.network'}/wallet" 
                     style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Get Started Now
                  </a>
                </div>
                
                <p>If you have any questions, feel free to reach out to our support team.</p>
                
                <p>Best regards,<br>
                <strong>The MySocial Team</strong></p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #666;">
                  This email was sent to ${emailData.email} because you signed up for MySocial.<br>
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://mysocial.network'}/unsubscribe?email=${encodeURIComponent(emailData.email)}" 
                     style="color: #667eea;">Unsubscribe</a> | 
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://mysocial.network'}/privacy" 
                     style="color: #667eea;">Privacy Policy</a>
                </p>
              </div>
            </body>
            </html>
          `
        },
        {
          type: 'text/plain',
          value: `
Welcome to MySocial, ${emailData.firstName || 'there'}!

Thank you for joining MySocial using your Google account. We're thrilled to have you as part of our growing community!

What's next?
- Complete your profile to connect with others
- Explore the MySocial ecosystem  
- Start building your decentralized social presence

Get started: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://mysocial.network'}/wallet

If you have any questions, feel free to reach out to our support team.

Best regards,
The MySocial Team

---
This email was sent to ${emailData.email} because you signed up for MySocial.
Unsubscribe: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://mysocial.network'}/unsubscribe?email=${encodeURIComponent(emailData.email)}
Privacy Policy: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://mysocial.network'}/privacy
          `
        }
      ]
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('SendGrid email API error:', errorData)
      throw new Error(`SendGrid email API error: ${response.status} - ${errorData}`)
    }

    // Get message ID from headers if available
    const messageId = response.headers.get('X-Message-Id')

    return { 
      success: true, 
      message: 'Welcome email sent successfully!',
      messageId: messageId || undefined
    }
    
  } catch (error) {
    console.error('SendGrid welcome email error:', error)
    return { 
      success: false, 
      message: 'Failed to send welcome email. Please try again.' 
    }
  }
}

// Combined function: Add to contact list AND send welcome email
export async function addContactAndSendWelcomeEmail(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<SendGridCombinedResponse> {
  
  // Prepare contact data (without custom fields to avoid SendGrid configuration issues)
  const contact: SendGridContact = {
    email,
    first_name: firstName,
    last_name: lastName
  }

  // Prepare email data
  const emailData: WelcomeEmailData = {
    email,
    firstName,
    lastName,
    fullName: `${firstName || ''} ${lastName || ''}`.trim() || undefined
  }

  // Use environment variables
  const listId = process.env.SENDGRID_CONTACT_LIST_ID
  const templateId = process.env.SENDGRID_WELCOME_TEMPLATE_ID

  // Execute contact addition first (optional feature)
  const contactResult = await smartAddContactToSendGrid(contact, listId)

  // If user is already in contact list, they've been welcomed before - skip email
  if (contactResult.success && contactResult.message === 'Already in contact list!') {
    return {
      contactAdded: contactResult,
      emailSent: {
        success: true,
        message: 'Welcome email skipped - user already welcomed'
      },
      overallSuccess: true
    }
  }

  // Send welcome email to new contacts only
  const emailResult = await sendWelcomeEmail(emailData, templateId)

  // Consider the process successful if at least the email was sent
  // Contact addition is nice-to-have but not critical for user experience
  return {
    contactAdded: contactResult,
    emailSent: emailResult,
    overallSuccess: emailResult.success // Focus on email success as primary goal
  }
}

// Google Auth specific helper - wrapper for the combined function
export async function processGoogleAuthUser(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<SendGridCombinedResponse> {
  return await addContactAndSendWelcomeEmail(email, firstName, lastName)
} 