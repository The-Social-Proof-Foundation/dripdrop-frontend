import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

export interface WelcomeEmailProps {
  firstName?: string
  email: string
  baseUrl?: string
}

export function WelcomeEmail({
  firstName = '',
  email,
  baseUrl = 'https://dripdrop.social'
}: WelcomeEmailProps) {
  const previewText = `Welcome to DripDrop! - TestFlight Invites Coming Soon`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        {/* Header with logo stack */}
        <Section style={header}>
            <Img
              src="https://dripdrop.social/dripdrop-silhouette-black-sm.png"
              width="44"
              height="52"
              alt="DripDrop Icon"
              style={silhouetteLogo}
            />
            <Img
              src="https://dripdrop.social/dripdrop-horizontal-black-sm.png"
              width="240"
              height="57"
              alt="DripDrop"
              style={horizontalLogo}
            />
        <Text style={headerSubtitle} className="text-center max-w-md mx-auto">
            The most fun 12-second video economy, all on-chain.
        </Text>
        </Section>

        {/* Main content */}
        <Section style={content}>        
        <Text style={paragraph}>
            Thank you for joining DripDrop! We&apos;re thrilled to have you as part of our growing community 
            building the future of decentralized social networking.
        </Text>

        <Text style={paragraph}>
            You&apos;ve successfully reserved your spot for the TestFlight beta. Here&apos;s what happens next:
        </Text>

        <Text style={paragraph}>
            While you wait for your TestFlight invite, follow us on social media for the latest updates 
            and sneak peeks of what&apos;s coming.
        </Text>

        <Text style={paragraph}>
            Questions? Feel free to reach out to us on X or Telegram.
        </Text>

        {/* Social Links */}
        <Section style={socialSection}>
            <Link href="https://x.com/dripdrop_social" style={socialLink}>
              X (Twitter)
            </Link>
            <Text style={socialDivider}>•</Text>
            <Link href="https://t.me/dripdrop_social" style={socialLink}>
              Telegram
            </Link>
            <Link href="https://www.mysocial.network/ecosystem/dripdrop" style={socialLink}>
                MySocial
            </Link>
        </Section>

        <Text style={signature}>
            Talk soon,<br />
            <strong>The DripDrop Team</strong>
        </Text>
        </Section>

        {/* Footer */}
        <Hr style={hr} />
        <Section style={footer}>
        <Text style={footerText}>
            This email was sent to {email} because you signed up for DripDrop TestFlight access.
        </Text>
        <Text style={footerText}>
            <Link href={`${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`} style={footerLink}>
            Unsubscribe
            </Link>
            {' • '}
            <Link href={`${baseUrl}/privacy`} style={footerLink}>
            Privacy Policy
            </Link>
            {' • '}
            <Link href={`${baseUrl}`} style={footerLink}>
            dripdrop.social
            </Link>
        </Text>
        </Section>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const header = {
  backgroundColor: '#f8fafc',
  padding: '40px 32px',
  textAlign: 'center' as const,
  borderBottom: 'none',
}

const silhouetteLogo = {
  margin: '0 auto 16px',
  display: 'block',
}

const horizontalLogo = {
  margin: '0 auto 24px',
  display: 'block',
}

const headerSubtitle = {
  color: '#969696',
  fontSize: '16px',
  lineHeight: '1.4',
  margin: '0',
}

const content = {
  backgroundColor: '#f8fafc',
  borderRadius: '0 0 12px 12px',
  padding: '32px',
  border: '1px solid #e2e8f0',
  borderTop: 'none',
}

const paragraph = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px',
}

const socialSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const socialLink = {
  color: '#568BEF',
  fontSize: '14px',
  textDecoration: 'none',
  fontWeight: '500',
}

const socialDivider = {
  color: '#000000',
  fontSize: '14px',
  margin: '0 8px',
  display: 'inline',
}

const signature = {
  color: '#000000',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '32px 0 0',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
}

const footer = {
  textAlign: 'center' as const,
  padding: '0 20px',
}

const footerText = {
  color: '#64748b',
  fontSize: '10px',
  lineHeight: '1.4',
  margin: '0 0 8px',
}

const footerLink = {
  color: '#667eea',
  textDecoration: 'none',
  fontSize: '10px',
}

export default WelcomeEmail