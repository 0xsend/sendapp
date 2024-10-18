import { Link } from '@my/ui'
import { useProfileHref } from 'app/utils/useProfileHref'
import type { PropsWithChildren } from 'react'

interface Props extends PropsWithChildren {
  senderSendId: string
}

export const SenderProfileLink = (props: Props) => {
  const profileHref: string = useProfileHref('sendid', props.senderSendId)

  return <Link href={profileHref}>{props.children}</Link>
}
