import { Avatar, type AvatarProps } from '@my/ui'
import { IconWithdraw } from '../icons'

export function AvatarSendEarnWithdraw(props: AvatarProps) {
  return (
    <Avatar size="$4.5" br="$4" gap="$2" backgroundColor="$error" {...props}>
      <IconWithdraw size="$2" color="$alabaster" />
    </Avatar>
  )
}
