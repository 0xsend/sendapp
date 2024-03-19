import { Avatar, AvatarProps } from 'tamagui'

export function ProfileAvatar({ avatarUrl, ...props }: AvatarProps & { avatarUrl?: string }) {
  return (
    <Avatar size={'$10'} borderRadius={'$3'} {...props}>
      <Avatar.Image src={avatarUrl ? avatarUrl : ''} />
      <Avatar.Fallback backgroundColor="$backgroundFocus" />
    </Avatar>
  )
}
