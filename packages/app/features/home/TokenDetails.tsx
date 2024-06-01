import {
  BigHeading,
  Button,
  H1,
  Label,
  Paragraph,
  Separator,
  Spinner,
  Stack,
  Text,
  Tooltip,
  XStack,
  YStack,
  useMedia,
} from '@my/ui'
import { baseMainnet } from '@my/wagmi'
import type { coins } from 'app/data/coins'
import { useSendAccount } from 'app/utils/send-accounts'
import { useBalance, type UseBalanceReturnType } from 'wagmi'

import { ArrowDown, ArrowUp } from '@tamagui/lucide-icons'
import { IconError } from 'app/components/icons'
import { amountFromActivity, eventNameFromActivity, subtextFromActivity } from 'app/utils/activity'
import { assert } from 'app/utils/assert'
import { useTokenMarketData } from 'app/utils/coin-gecko'
import formatAmount from 'app/utils/formatAmount'
import { hexToBytea } from 'app/utils/hexToBytea'
import type { SendAccountTransfersEvent } from 'app/utils/zod/activity'
import { Fragment } from 'react'
import { ActivityAvatar } from '../activity/ActivityAvatar'
import { AnimateEnter, RowLabel } from '../activity/screen'
import { useTokenActivityFeed } from './utils/useTokenActivityFeed'

export const TokenDetails = ({ coin }: { coin: coins[number] }) => {
  const media = useMedia()
  const { data: sendAccount } = useSendAccount()
  const balance = useBalance({
    address: sendAccount?.address,
    token: coin.token === 'eth' ? undefined : coin.token,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  return (
    <YStack f={1}>
      {media.gtLg && coin.label !== 'USDC' && (
        <XStack w={'100%'} ai={'center'} jc={'space-between'} $gtLg={{ mt: '$9' }} mt={'$6'}>
          <Separator $theme-dark={{ boc: '$decay' }} $theme-light={{ boc: '$gray4Light' }} />
          <Stack
            bw={1}
            br={'$2'}
            $theme-dark={{ boc: '$decay' }}
            $theme-light={{ boc: '$gray4Light' }}
            p={'$1.5'}
            jc="center"
            miw="$18"
          >
            <TokenDetailsMarketData coin={coin} />
          </Stack>
        </XStack>
      )}
      <YStack>
        <Label fontSize={'$5'} fontWeight={'500'} color={'$color11'} textTransform={'uppercase'}>
          {`${coin.label} BALANCE`}
        </Label>
        <TokenDetailsBalance balance={balance} symbol={coin.symbol} />
      </YStack>
      <Stack w={'100%'} py={'$6'}>
        <Separator $theme-dark={{ boc: '$decay' }} $theme-light={{ boc: '$gray4Light' }} />
      </Stack>
      <YStack>
        {(() => {
          if (coin.token === 'eth') {
            return <TokenDetailsHistoryComingSoon />
          }
          return <TokenDetailsHistory coin={coin} />
        })()}
      </YStack>
    </YStack>
  )
}

export const TokenDetailsMarketData = ({ coin }: { coin: coins[number] }) => {
  const { data: tokenMarketData, status } = useTokenMarketData(coin.coingeckoTokenId)

  const price = tokenMarketData?.at(0)?.current_price

  const changePercent24h = tokenMarketData?.at(0)?.price_change_percentage_24h

  if (status === 'pending') return <Spinner size="small" />
  if (status === 'error' || price === undefined || changePercent24h === undefined)
    return (
      <XStack gap="$2" ai="center" jc={'center'}>
        <Paragraph>Failed to load market data</Paragraph>
        <IconError size="$1.75" color={'$redVibrant'} />
      </XStack>
    )

  const formatPriceChange = (change: number) => {
    const fixedChange = change.toFixed(2)
    if (change > 0)
      return (
        <>
          <Paragraph fontSize="$4" fontWeight="500" color={'$olive'}>{`${fixedChange}%`}</Paragraph>
          <ArrowUp col={'$olive'} size={'$0.9'} />
        </>
      )
    if (change < 0)
      return (
        <>
          <Paragraph
            fontSize="$4"
            fontWeight="500"
            color={'$redVibrant'}
          >{`${fixedChange}%`}</Paragraph>
          <ArrowDown col={'$redVibrant'} size={'$0.9'} />
        </>
      )
    return (
      <>
        <Paragraph
          fontSize="$4"
          fontWeight="500"
          color={'$redVibrant'}
        >{`${fixedChange}%`}</Paragraph>
      </>
    )
  }

  return (
    <XStack gap="$2" ai="center" jc={'space-around'}>
      <Paragraph
        fontSize="$4"
        fontWeight="500"
        $theme-dark={{ color: '$gray8Light' }}
        color={'$color12'}
      >
        {`1 ${coin.symbol} = ${price} USD`}
      </Paragraph>
      <XStack gap={'$1.5'} ai="center" jc={'space-around'}>
        {formatPriceChange(changePercent24h)}
      </XStack>
    </XStack>
  )
}

const TokenDetailsBalance = ({
  symbol,
  balance,
}: { symbol: string; balance: UseBalanceReturnType }) => {
  if (balance?.isError) {
    return <>---</>
  }
  if (balance?.isFetching && balance?.isPending) {
    return <Spinner size={'small'} />
  }
  if (balance?.data?.value === undefined) {
    return <></>
  }

  const balanceWithDecimals = Number(balance.data.value) / 10 ** (balance.data?.decimals ?? 0)
  return (
    <Tooltip placement="bottom">
      <Tooltip.Trigger $platform-web={{ width: 'fit-content' }}>
        <BigHeading $platform-web={{ width: 'fit-content' }} color={'$color12'}>
          {formatAmount(balanceWithDecimals.toString())}
        </BigHeading>
      </Tooltip.Trigger>
      <Tooltip.Content
        enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        scale={1}
        x={0}
        y={0}
        opacity={1}
        animation={[
          'quick',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
      >
        <Tooltip.Arrow />

        <Paragraph fontSize={'$6'} fontWeight={'500'}>
          {`${balanceWithDecimals.toLocaleString()} ${symbol}`}
        </Paragraph>
      </Tooltip.Content>
    </Tooltip>
  )
}

const TokenDetailsHistory = ({ coin }: { coin: coins[number] }) => {
  assert(coin.token !== 'eth', 'ETH token does not have a history')
  const result = useTokenActivityFeed({
    pageSize: 10,
    address: hexToBytea(coin.token),
  })
  const {
    data,
    isLoading: isLoadingActivities,
    error: activitiesError,
    isFetching: isFetchingActivities,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = result
  const { pages } = data ?? {}
  return (
    <YStack gap="$5">
      {(() => {
        switch (true) {
          case isLoadingActivities:
            return <Spinner size="small" />
          case activitiesError !== null:
            return (
              <Paragraph maxWidth={'600'} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
                {activitiesError?.message.split('.').at(0) ?? `${activitiesError}`}
              </Paragraph>
            )
          case pages?.length === 0:
            return (
              <>
                <RowLabel>No activities</RowLabel>
              </>
            )
          default: {
            let lastDate: string | undefined
            return pages?.map((activities) => {
              return activities?.map((activity) => {
                const date = activity.created_at.toLocaleDateString()
                const isNewDate = !lastDate || date !== lastDate
                if (isNewDate) {
                  lastDate = date
                }
                return (
                  <Fragment
                    key={`${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`}
                  >
                    {isNewDate ? <RowLabel>{lastDate}</RowLabel> : null}
                    <AnimateEnter>
                      <TokenActivityRow activity={activity} />
                    </AnimateEnter>
                  </Fragment>
                )
              })
            })
          }
        }
      })()}
      <AnimateEnter>
        {!isLoadingActivities && (isFetchingNextPageActivities || hasNextPage) ? (
          <>
            {isFetchingNextPageActivities && <Spinner size="small" />}
            {hasNextPage && (
              <Button
                onPress={() => {
                  fetchNextPage()
                }}
                disabled={isFetchingNextPageActivities || isFetchingActivities}
                color="$color"
                width={200}
                mx="auto"
              >
                Load More
              </Button>
            )}
          </>
        ) : null}
      </AnimateEnter>
    </YStack>
  )
}

function TokenActivityRow({ activity }: { activity: SendAccountTransfersEvent }) {
  const media = useMedia()
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
            <Text
              color="$color12"
              fontSize="$7"
              //  $gtMd={{ display: 'none', fontSize: '$5' }}
            >
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
              // $gtMd={{ fontSize: '$2' }}
              maxWidth={'100%'}
              overflow={'hidden'}
            >
              {subtext}
            </Text>
            {/* <Text
              display="none"
              // @NOTE: font families don't change in `$gtMd` breakpoint
              fontFamily={media.md ? '$mono' : '$body'}
              $gtSm={{ display: 'flex' }}
              // $gtMd={{ display: 'none' }}
            >
              •
            </Text> */}
            <Text
            // $gtMd={{ display: 'none' }}
            >
              {date}
            </Text>
          </Stack>
        </YStack>
      </XStack>
      <XStack
        gap="$4"
        display="none"
        // $gtMd={{ display: 'flex' }}
      >
        <Text color="$color12" minWidth={'$14'} textAlign="right" jc={'flex-end'}>
          {date}
        </Text>
        <Text
          color="$color12"
          textAlign="right"
          fontSize="$7"
          // @NOTE: font families don't change in `$gtMd` breakpoint
          fontFamily={media.md ? '$mono' : '$body'}
          $gtMd={{
            fontSize: '$5',
            //  minWidth: '$14'
          }}
        >
          {amount}
        </Text>
      </XStack>
    </XStack>
  )
}

const TokenDetailsHistoryComingSoon = () => {
  return (
    <>
      <Label fontSize="$7" fontWeight="500" color={'$color11'} textTransform={'uppercase'}>
        HISTORY
      </Label>
      <H1 fontSize="$9" fontWeight="700" color={'$color12'}>
        Coming Soon
      </H1>
    </>
  )
}
