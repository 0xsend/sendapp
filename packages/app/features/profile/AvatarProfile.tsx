import { Avatar, SizableText, type AvatarProps } from '@my/ui'

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
