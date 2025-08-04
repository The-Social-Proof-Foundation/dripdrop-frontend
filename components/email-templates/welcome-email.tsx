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
              width="40"
              height="48"
              alt="DripDrop Icon"
              style={silhouetteLogo}
            />
            <Img
              src="https://dripdrop.social/dripdrop-horizontal-black-sm.png"
              width="160"
              height="38"
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

        {/* Feature highlights */}
        <Section style={featuresSection}>
            <Text style={featureItem}>
            📱 <strong>TestFlight Invite:</strong> You&apos;ll receive your beta access soon
            </Text>
            <Text style={featureItem}>
            🌐 <strong>Decentralized Social:</strong> Connect without centralized control
            </Text>
            <Text style={featureItem}>
            🔐 <strong>Own Your Data:</strong> Your content, your rules, your ownership
            </Text>
            <Text style={featureItem}>
            💫 <strong>MySocial Network:</strong> Part of the larger decentralized ecosystem
            </Text>
        </Section>

        <Text style={paragraph}>
            While you wait for your TestFlight invite, follow us on social media for the latest updates 
            and sneak peeks of what&apos;s coming.
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
        </Section>

        <Text style={paragraph}>
            Questions? Feel free to reach out to us on X or Telegram.
        </Text>

        <Text style={signature}>
            Talk soon,<br />
            The DripDrop Team
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
  backgroundColor: '#ffffff',
  borderRadius: '12px 12px 0 0',
  padding: '40px 32px',
  textAlign: 'center' as const,
  border: '1px solid #e2e8f0',
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

const headerTitle = {
  color: '#1e293b',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 8px',
}

const headerSubtitle = {
  color: '#000000',
  fontSize: '16px',
  lineHeight: '1.4',
  margin: '0',
}

const content = {
  backgroundColor: '#ffffff',
  borderRadius: '0 0 12px 12px',
  padding: '32px',
  border: '1px solid #e2e8f0',
  borderTop: 'none',
}

const mainHeading = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 24px',
}

const paragraph = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px',
}

const featuresSection = {
  margin: '24px 0',
  padding: '20px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
}

const featureItem = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px',
  lastChild: {
    marginBottom: '0',
  },
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#667eea',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  lineHeight: '1.4',
}

const socialSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const socialLink = {
  color: '#667eea',
  fontSize: '14px',
  textDecoration: 'none',
  fontWeight: '500',
}

const socialDivider = {
  color: '#94a3b8',
  fontSize: '14px',
  margin: '0 8px',
  display: 'inline',
}

const signature = {
  color: '#475569',
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