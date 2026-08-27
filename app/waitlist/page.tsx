import type { Metadata } from 'next'
import { WaitlistPageClient } from '@/components/waitlist/waitlist-page-client'

export const metadata: Metadata = {
  title: 'Waitlist — DripDrop',
  description: 'View your waitlist status and join early access for DripDrop.',
}

export default function WaitlistPage() {
  return <WaitlistPageClient />
}
