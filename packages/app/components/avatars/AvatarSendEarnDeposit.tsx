import { Avatar, type AvatarProps } from '@my/ui'
import { IconDeposit } from '../icons'

export function AvatarSendEarnDeposit(props: AvatarProps) {
  return (
    <Avatar size="$4.5" br="$4" gap="$2" backgroundColor="$olive" {...props}>
      <IconDeposit size="$2" color="$alabaster" />
    </Avatar>
  )
}
