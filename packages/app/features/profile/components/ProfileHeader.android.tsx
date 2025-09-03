import type { Functions } from '@my/supabase/database.types'
import { useRouter } from 'expo-router'
import { ProfileHeaderContent } from 'app/features/profile/components/ProfileHeaderContent'

export default function ProfileHeader({
  recipient,
  idType,
  profile,
}: {
  profile?: Functions<'profile_lookup'>[number] | null
  idType?: string
  recipient?: string
}) {
  const router = useRouter()

  return (
    <ProfileHeaderContent
      profile={profile}
      idType={idType}
      recipient={recipient}
      onPress={() => router.push(`/profile/${profile?.sendid}`)}
    />
  )
}
