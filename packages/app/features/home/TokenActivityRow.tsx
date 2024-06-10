import { Stack, Text, XStack, YStack, useMedia } from '@my/ui'
import { amountFromActivity, eventNameFromActivity, subtextFromActivity } from 'app/utils/activity'
import type { SendAccountTransfersEvent } from 'app/utils/zod/activity'
import { ActivityAvatar } from '../activity/ActivityAvatar'

export function TokenActivityRow({ activity }: { activity: SendAccountTransfersEvent }) {
  const { created_at } = activity
  const amount = amountFromActivity(activity)
  const date = new Date(created_at).toLocaleString()
  const eventName = eventNameFromActivity(activity)
  const subtext = subtextFromActivity(activity)

  return (
    <XStack
      width={'100%'}
      ai="center"
      jc="space-between"
      gap="$4"
      borderBottomWidth={1}
      pb="$5"
      borderBottomColor={'$decay'}
      $gtMd={{ borderBottomWidth: 0, pb: '0' }}
    >
      <XStack gap="$4.5" width={'100%'} f={1}>
        <ActivityAvatar activity={activity} />
        <YStack gap="$1.5" width={'100%'} f={1} overflow="hidden">
          <XStack fd="row" jc="space-between" gap="$1.5" f={1} width={'100%'}>
            <Text color="$color12" fontSize="$7" $gtMd={{ fontSize: '$5' }}>
              {eventName}
            </Text>
            <Text color="$color12" fontSize="$7">
              {amount}
            </Text>
          </XStack>
          <Stack
            gap="$1.5"
            fd="column"
            $gtSm={{ fd: 'row' }}
            alignItems="flex-start"
            justifyContent="space-between"
            width="100%"
            overflow="hidden"
            f={1}
          >
            <Text
              theme="alt2"
              color="$olive"
              fontFamily={'$mono'}
              maxWidth={'100%'}
              overflow={'hidden'}
            >
              {subtext}
            </Text>
            <Text>{date}</Text>
          </Stack>
        </YStack>
      </XStack>
    </XStack>
  )
}
