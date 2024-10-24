import type { Functions } from '@my/supabase/database.types'
import { AvatarProfile } from 'app/features/profile/AvatarProfile'

interface Props {
  profileData: Functions<'profile_lookup'>[number]
}

export const SenderProfileAvatar = (props: Props) => {
  return props.profileData && <AvatarProfile profile={props.profileData} size="$4" mx="$0" />
}
