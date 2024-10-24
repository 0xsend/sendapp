import type { Functions } from '@my/supabase/database.types'
import { XStack } from '@my/ui'
import { SenderProfileAvatar } from 'app/features/checks/components/claim/check/sender-data/SenderProfileAvatar'
import { SenderProfileLink } from 'app/features/checks/components/claim/check/sender-data/SenderProfileLink'
import { SenderProfileName } from 'app/features/checks/components/claim/check/sender-data/SenderProfileName'

interface Props {
  profileData: Functions<'profile_lookup'>[number]
  senderSendId: string
}

export const SenderData = (props: Props) => {
  return (
    props.profileData?.name && (
      <SenderProfileLink senderSendId={props.senderSendId}>
        <XStack alignItems="center" gap="$2">
          <SenderProfileAvatar profileData={props.profileData} />
          {props.profileData?.name && <SenderProfileName profileName={props.profileData.name} />}
        </XStack>
      </SenderProfileLink>
    )
  )
}
