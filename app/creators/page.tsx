import type { Metadata } from 'next'
import { CreatorsPageClient } from '@/components/waitlist/creators-page-client'

export const metadata: Metadata = {
  title: 'Creator Early Access — DripDrop',
  description: 'Apply for DripDrop creator early access and a complimentary creator badge.',
}

export default function CreatorsPage() {
  return <CreatorsPageClient />
}
