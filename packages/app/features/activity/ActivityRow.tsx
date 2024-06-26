import { Stack, Text, XStack, YStack, useMedia } from '@my/ui'
import { amountFromActivity, eventNameFromActivity, subtextFromActivity } from 'app/utils/activity'
import type { Activity } from 'app/utils/zod/activity'
import { ActivityAvatar } from './ActivityAvatar'

export function ActivityRow({ activity }: { activity: Activity }) {
  const media = useMedia()
  const { created_at } = activity
  const amount = amountFromActivity(activity)
  const date = new Date(created_at).toLocaleString()
  const eventName = eventNameFromActivity(activity)
  const subtext = subtextFromActivity(activity)

  return (
    <XStack
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
        <YStack gap="$1.5" width={'100%'} f={1}>
          <XStack fd="row" jc="space-between" gap="$1.5" f={1} width={'100%'}>
            <Text color="$color12" fontSize="$7" $gtMd={{ fontSize: '$5' }}>
              {eventName}
            </Text>
            <Text
              color="$color12"
              fontSize="$7"
              $gtMd={{ display: 'none', fontSize: '$5' }}
              testID="ActivityRowAmount"
            >
              {amount}
            </Text>
          </XStack>
          <Stack
            gap="$1.5"
            fd="column"
            $gtSm={{ fd: 'row' }}
            alignItems="flex-start"
            width="100%"
            f={1}
          >
            <Text
              theme="alt2"
              color="$olive"
              fontFamily={'$mono'}
              $gtMd={{ fontSize: '$2' }}
              maxWidth={'100%'}
              overflow={'hidden'}
            >
              {subtext}
            </Text>
            <Text
              display="none"
              // @NOTE: font families don't change in `$gtMd` breakpoint
              fontFamily={media.md ? '$mono' : '$body'}
              $gtSm={{ display: 'flex' }}
              $gtMd={{ display: 'none' }}
            >
              •
            </Text>
            <Text $gtMd={{ display: 'none' }}>{date}</Text>
          </Stack>
        </YStack>
      </XStack>
      <XStack gap="$4" display="none" $gtMd={{ display: 'flex' }}>
        <Text color="$color12" minWidth={'$14'} textAlign="right" jc={'flex-end'}>
          {date}
        </Text>
        <Text
          color="$color12"
          textAlign="right"
          fontSize="$7"
          // @NOTE: font families don't change in `$gtMd` breakpoint
          fontFamily={media.md ? '$mono' : '$body'}
          $gtMd={{ fontSize: '$5', minWidth: '$14' }}
        >
          {amount}
        </Text>
      </XStack>
    </XStack>
  )
}
