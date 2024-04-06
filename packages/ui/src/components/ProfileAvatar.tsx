import { Avatar, type AvatarProps } from 'tamagui'

export function ProfileAvatar({ avatarUrl, ...props }: AvatarProps & { avatarUrl?: string }) {
  return (
    <Avatar $gtMd={{ size: 133.5 }} size={'$10'} borderRadius={'$3'} {...props}>
      <Avatar.Image
        $gtMd={{ w: 133.5, h: 133.5 }}
        w={'$10'}
        h="$10"
        src={avatarUrl ? avatarUrl : ''}
      />
      <Avatar.Fallback backgroundColor="$backgroundFocus" />
    </Avatar>
  )
}
