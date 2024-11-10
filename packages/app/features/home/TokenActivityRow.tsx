import { Paragraph, Text, XStack, YStack } from '@my/ui'
import { amountFromActivity, eventNameFromActivity, subtextFromActivity } from 'app/utils/activity'
import {
  isSendAccountReceiveEvent,
  isSendAccountTransfersEvent,
  type Activity,
} from 'app/utils/zod/activity'
import { ActivityAvatar } from '../activity/ActivityAvatar'
import { CommentsTime } from 'app/utils/dateHelper'
import { Link } from 'solito/link'

import { useUser } from 'app/utils/useUser'

export function TokenActivityRow({ activity }: { activity: Activity }) {
  const { profile } = useUser()
  const { created_at, from_user, to_user } = activity
  const amount = amountFromActivity(activity)
  const date = CommentsTime(new Date(created_at))
  const eventName = eventNameFromActivity(activity)
  const subtext = subtextFromActivity(activity)
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)

  return (
    <XStack width={'100%'} ai="center" jc="space-between" gap="$4" pb="$2">
      <XStack gap="$4.5" width={'100%'} f={1}>
        <ActivityAvatar activity={activity} />
        <YStack gap="$1.5" width={'100%'} f={1} overflow="hidden">
          <XStack fd="row" jc="space-between" gap="$1.5" f={1} width={'100%'}>
            <Text color="$color12" fontSize="$6" $gtMd={{ fontSize: '$5' }}>
              {eventName}
            </Text>
            <Text color="$color12" fontSize="$5" ta="right">
              {amount}
            </Text>
          </XStack>
          <XStack
            gap="$1.5"
            alignItems="flex-start"
            justifyContent="space-between"
            width="100%"
            overflow="hidden"
            f={1}
          >
            {(isERC20Transfer || isETHReceive) &&
            Boolean(to_user?.send_id) &&
            Boolean(from_user?.send_id) ? (
              <Link
                href={`/profile/${
                  profile?.send_id === from_user?.send_id ? to_user?.send_id : from_user?.send_id
                }`}
              >
                <Paragraph
                  color="$color10"
                  fontFamily={'$mono'}
                  maxWidth={'100%'}
                  overflow={'hidden'}
                  fontSize="$4"
                  textDecorationLine="underline"
                >
                  {subtext}
                </Paragraph>
              </Link>
            ) : (
              <Paragraph
                color="$color10"
                fontFamily={'$mono'}
                maxWidth={'100%'}
                overflow={'hidden'}
                fontSize="$4"
              >
                {subtext}
              </Paragraph>
            )}
            <Paragraph color="$color10" size={'$3'}>
              {date}
            </Paragraph>
          </XStack>
        </YStack>
      </XStack>
    </XStack>
  )
}
