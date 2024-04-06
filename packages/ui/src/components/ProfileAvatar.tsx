import { Avatar, type AvatarProps } from 'tamagui'

export function ProfileAvatar({ avatarUrl, ...props }: AvatarProps & { avatarUrl?: string }) {
  return (
    <Avatar $gtMd={{ size: 133.5 }} size={'$10'} borderRadius={'$3'} {...props}>
      <Avatar.Image src={avatarUrl ? avatarUrl : ''} />
      <Avatar.Fallback backgroundColor="$backgroundFocus" />
    </Avatar>
  )
}
