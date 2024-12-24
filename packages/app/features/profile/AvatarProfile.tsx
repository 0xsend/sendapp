import { Avatar, type AvatarProps } from '@my/ui'
import { IconAccount } from 'app/components/icons'

export type AvatarProfileProps = { name: string | null; avatar_url: string | null } | null

export function AvatarProfile({
  profile,
  ...rest
}: AvatarProps & { profile?: AvatarProfileProps }) {
  return (
    <Avatar testID="avatar" size="$8" br="$4" gap="$2" mx="auto" $gtSm={{ mx: '0' }} {...rest}>
      <Avatar.Image
        testID="avatarImage"
        accessibilityLabel={profile?.name ?? '??'}
        accessibilityRole="image"
        accessible
        src={profile?.avatar_url ?? ''}
      />
      <Avatar.Fallback jc="center" ai="center">
        <IconAccount size="$6" color="$olive" />
      </Avatar.Fallback>
    </Avatar>
  )
}
