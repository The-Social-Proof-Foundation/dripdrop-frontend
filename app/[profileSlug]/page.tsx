import { ProfilePageClient } from '@/components/profile/profile-page-client'

interface ProfilePageProps {
  params: Promise<{ profileSlug: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { profileSlug } = await params
  return <ProfilePageClient profileSlug={profileSlug} />
}
