import { Avatar, Stack, Text, XStack, YStack, useMedia } from '@my/ui'
import formatAmount from 'app/utils/formatAmount'
import {
  isSendAccountTransfersEvent,
  isTagReceiptsEvent,
  type Activity,
} from 'app/utils/zod/activity'
import { isReferralsEvent } from 'app/utils/zod/activity/ReferralsEventSchema'
import { formatUnits } from 'viem'

export function ActivityRow({ activity }: { activity: Activity }) {
  const media = useMedia()
  const { from_user, to_user, event_name, created_at } = activity
  const user = (() => {
    if (isTagReceiptsEvent(activity)) {
      return from_user
    }
    if (isReferralsEvent(activity)) {
      return to_user // show the referred
    }
    if (isSendAccountTransfersEvent(activity)) {
      if (from_user?.id) {
        // if i am the sender, show the receiver
        return to_user
      }
      if (to_user?.id) {
        // if i am the receiver, show the sender
        return from_user
      }
    }
    return null // not a send or receive event
  })()
  const avatar = (() => {
    if (user) {
      return (
        <Avatar size="$4.5" br="$4" gap="$2">
          <Avatar.Image src={user?.avatar_url ?? undefined} />
          <Avatar.Fallback jc="center" bc="$olive">
            <Avatar size="$4.5" br="$4">
              <Avatar.Image
                src={`https://ui-avatars.com/api/?name=${
                  user?.name ?? user?.tags?.[0] ?? user?.send_id
                }&size=256&format=png&background=86ad7f`}
              />
            </Avatar>
          </Avatar.Fallback>
        </Avatar>
      )
    }
    if (isSendAccountTransfersEvent(activity)) {
      // is transfer, but an unknown user
      const address = from_user?.id ? activity.data.t : activity.data.f
      return (
        <Avatar size="$4.5" br="$4" gap="$2">
          <Avatar.Image
            src={`https://ui-avatars.com/api/?name=${address}&size=256&format=png&background=86ad7f`}
          />
          <Avatar.Fallback jc="center" bc="$olive">
            <Avatar size="$4.5" br="$4">
              <Avatar.Image
                src={`https://ui-avatars.com/api/?name=${address}&size=256&format=png&background=86ad7f`}
              />
            </Avatar>
          </Avatar.Fallback>
        </Avatar>
      )
    }
    return (
      <Avatar size="$4.5" br="$4" gap="$2">
        <Avatar.Image
          src={'https://ui-avatars.com/api/?name=TODO&size=256&format=png&background=86ad7f'}
        />
        <Avatar.Fallback jc="center" bc="$olive">
          <Avatar size="$4.5" br="$4">
            <Avatar.Image
              src={'https://ui-avatars.com/api/?name=TODO&size=256&format=png&background=86ad7f'}
            />
          </Avatar>
        </Avatar.Fallback>
      </Avatar>
    )
  })()
  const amount = (() => {
    switch (true) {
      case isSendAccountTransfersEvent(activity): {
        const { v, coin } = activity.data
        if (coin) {
          const amount = formatUnits(v, coin.decimals)
          return `${amount} ${coin.symbol}`
        }
        return formatAmount(`${v}`, 5, 0)
      }
      case isTagReceiptsEvent(activity): {
        const data = activity.data
        const amount = formatUnits(data.value, data.coin.decimals)
        return `${amount} ${data.coin.symbol}`
      }
      case isReferralsEvent(activity): {
        const data = activity.data
        return `${data.tags.length} Referrals`
      }
      default:
        if (__DEV__) console.log('unknown activity', activity)
    }
  })()
  const date = new Date(created_at).toLocaleString()
  const eventName = (() => {
    switch (true) {
      case isSendAccountTransfersEvent(activity) && !!to_user?.id:
        return 'Received'
      case isSendAccountTransfersEvent(activity) && !!from_user?.id:
        return 'Sent'
      case isTagReceiptsEvent(activity):
        return 'Sendtag Registered'
      case isReferralsEvent(activity):
        return 'Referral'
      default:
        return event_name
          .split('_')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ')
    }
  })()
  const subtext = (() => {
    if (isTagReceiptsEvent(activity) || isReferralsEvent(activity)) {
      return activity.data.tags.map((t) => `@${t}`).join(', ')
    }
    if (user) {
      if (user.tags?.[0]) {
        return `@${user.tags[0]}`
      }
      return `#${user.send_id}`
    }
    if (isSendAccountTransfersEvent(activity) && from_user?.id) {
      return activity.data.t
    }
    if (isSendAccountTransfersEvent(activity) && to_user?.id) {
      return activity.data.f
    }
    return null
  })()

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
        {avatar}
        <YStack gap="$1.5" width={'100%'} f={1}>
          <XStack fd="row" jc="space-between" gap="$1.5" f={1} width={'100%'}>
            <Text color="$color12" fontSize="$7" $gtMd={{ fontSize: '$5' }}>
              {eventName}
            </Text>
            <Text color="$color12" fontSize="$7" $gtMd={{ display: 'none', fontSize: '$5' }}>
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
