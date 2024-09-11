import type { Functions } from '@my/supabase/database.types'
import { Avatar, SizableText, type AvatarProps } from '@my/ui'

export function AvatarProfile({
  profile,
  ...rest
}: AvatarProps & { profile?: Functions<'profile_lookup'>[number] | null }) {
  return (
    <Avatar testID="avatar" size="$8" br="$4" gap="$2" mx="auto" $gtSm={{ mx: '0' }} {...rest}>
      <Avatar.Image
        testID="avatarImage"
        accessibilityLabel={profile?.name ?? '??'}
        accessibilityRole="image"
        accessible
        src={
          profile?.avatar_url ??
          `https://ui-avatars.com/api.jpg?name=${profile?.name ?? '??'}&size=256`
        }
      />
      <Avatar.Fallback bc="$backgroundFocus" f={1} justifyContent="center" alignItems="center">
        <SizableText size="$12">??</SizableText>
      </Avatar.Fallback>
    </Avatar>
  )
}
