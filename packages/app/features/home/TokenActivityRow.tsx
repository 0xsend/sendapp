import { Avatar, LinkableAvatar, Spinner, Stack, Text, XStack, YStack } from '@my/ui'
import { amountFromActivity, eventNameFromActivity, subtextFromActivity } from 'app/utils/activity'
import type { Activity } from 'app/utils/zod/activity'
import { ActivityAvatar } from '../activity/ActivityAvatar'
import type { transferState } from '@my/workflows'
import { sendAccountAbi, erc20Abi } from '@my/wagmi'
import { decodeFunctionData, formatUnits } from 'viem'
import type { coins } from 'app/data/coins'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import formatAmount from 'app/utils/formatAmount'

export function TokenActivityRow({ activity }: { activity: Activity }) {
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

export function PendingTransferActivityRow({
  coin,
  state,
}: { coin: coins[number]; state: transferState }) {
  const { userOp } = state
  const { args } = decodeFunctionData({ abi: sendAccountAbi, data: userOp.callData })

  const decodedTokenTransfer =
    args?.[0]?.[0].data !== '0x'
      ? decodeFunctionData({ abi: erc20Abi, data: args?.[0]?.[0].data })
      : undefined

  const amount = decodedTokenTransfer
    ? formatUnits(decodedTokenTransfer.args[1] as bigint, coin.decimals)
    : formatAmount(formatUnits(args?.[0]?.[0].value, 18), 5, 5)

  const to = decodedTokenTransfer ? decodedTokenTransfer.args[0] : args?.[0]?.[0].dest

  const { data: profile } = useProfileLookup('address', to)

  return (
    <XStack
      width={'100%'}
      ai="center"
      jc="space-between"
      gap="$4"
      borderBottomWidth={1}
      pb="$5"
      borderBottomColor={'$decay'}
      opacity={0.75}
      $gtMd={{ borderBottomWidth: 0, pb: '0' }}
    >
      <XStack gap="$4.5" width={'100%'} f={1}>
        <LinkableAvatar size="$4.5" br="$4" gap="$2" href={`/profile/${profile?.sendid}`}>
          <Avatar.Image src={profile?.avatar_url ?? undefined} />
          <Avatar.Fallback jc="center" bc="$olive">
            <Avatar size="$4.5" br="$4">
              <Avatar.Image
                src={`https://ui-avatars.com/api/?name=${
                  profile?.tag ?? profile?.sendid
                }&size=256&format=png&background=86ad7f`}
              />
            </Avatar>
          </Avatar.Fallback>
        </LinkableAvatar>
        <YStack gap="$1.5" width={'100%'} f={1} overflow="hidden">
          <XStack fd="row" jc="space-between" gap="$1.5" f={1} width={'100%'}>
            <Text
              color="$color12"
              fontSize="$7"
              $gtMd={{ fontSize: '$5' }}
              textTransform="capitalize"
            >
              Sending...
            </Text>
            <Text color="$color12" fontSize="$7">
              {`${amount} ${coin.symbol}`}
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
              {profile?.name ?? profile?.tag ?? profile?.sendid}
            </Text>
            <Spinner size="small" color={'$color12'} />
          </Stack>
        </YStack>
      </XStack>
    </XStack>
  )
}
