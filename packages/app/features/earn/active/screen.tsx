import {
  Card,
  Fade,
  Paragraph,
  PrimaryButton,
  Separator,
  Spinner,
  Stack,
  XStack,
  YStack,
} from '@my/ui'
import type { IconProps } from '@tamagui/helpers-icon'
import { ArrowDown } from '@tamagui/lucide-icons'
import { IconStacks, IconStarOutline } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { formatCoinAmount } from 'app/utils/formatCoinAmount'
import { toNiceError } from 'app/utils/toNiceError'
import debug from 'debug'
import { type NamedExoticComponent, useMemo, memo } from 'react'
import { Link } from 'solito/link'
import { useRouter } from 'solito/router'
import { useSendEarnCoin } from '../providers/SendEarnProvider'
import { coinToParam, useERC20AssetCoin } from '../params'
import { Platform } from 'react-native'
import { useHoverStyles } from 'app/utils/useHoverStyles'

const log = debug('app:earn:active')

export function ActiveEarningsScreen() {
  return <ActiveEarnings />
}
function ActiveEarnings() {
  const { push } = useRouter()
  const coin = useERC20AssetCoin()
  const { affiliateRewards } = useSendEarnCoin(coin.data || undefined)
  const isAffiliate = useMemo(
    () => !!affiliateRewards.data?.vault?.send_earn_affiliate,
    [affiliateRewards.data]
  )
  const buttons: {
    Icon: NamedExoticComponent<IconProps>
    label: string
    href: string
  }[] = useMemo(() => {
    if (!coin || !coin.data) return []
    return (
      [
        {
          Icon: ArrowDown,
          label: 'Withdraw',
          href: `/earn/${coinToParam(coin.data)}/withdraw`,
        },
        {
          Icon: IconStacks,
          label: 'Earnings',
          href: `/earn/${coinToParam(coin.data)}/balance`,
        },
        isAffiliate
          ? {
              Icon: IconStarOutline,
              label: 'Rewards',
              href: `/earn/${coinToParam(coin.data)}/rewards`,
            }
          : null,
      ] as const
    ).filter((b): b is NonNullable<typeof b> => b !== null)
  }, [coin, isAffiliate])

  if (!coin.isLoading && !coin.data) {
    push('/earn')
    return null
  }

  log('ActiveEarnings', { coin })

  return (
    <YStack
      w={'100%'}
      gap={'$4'}
      jc={'space-between'}
      f={Platform.OS === 'web' ? undefined : 1}
      $gtLg={{ w: '50%', pb: '$3.5' }}
    >
      <YStack w={'100%'} gap={'$4'}>
        <TotalValue />
        <XStack flexGrow={1} gap={'$3.5'}>
          {buttons.map(({ Icon, label, href }) => (
            <EarningButton Icon={Icon} label={label} href={href} key={href} />
          ))}
        </XStack>
        <ActiveEarningBreakdown />
      </YStack>
      <PrimaryButton
        onPress={() => (!coin.data ? undefined : push(`/earn/${coinToParam(coin.data)}/deposit`))}
      >
        <PrimaryButton.Text>ADD MORE DEPOSITS</PrimaryButton.Text>
      </PrimaryButton>
    </YStack>
  )
}

/**
 * The current total value of Send Earn deposits.
 * TODO: use token price if not USDC
 */
function TotalValue() {
  const coin = useERC20AssetCoin()
  const { coinBalances, affiliateRewards } = useSendEarnCoin(coin.data || undefined)
  const totalValue = useMemo(() => {
    if (!coinBalances.data) return '0'
    if (!coin.data) return '0'
    let totalAssets = coinBalances.data.reduce((acc, balance) => {
      return acc + balance.currentAssets
    }, 0n)

    if (affiliateRewards.data) {
      totalAssets += affiliateRewards.data.assets
    }

    return formatCoinAmount({ amount: totalAssets, coin: coin.data })
  }, [coinBalances.data, coin.data, affiliateRewards.data])

  const isLoading = coinBalances.isLoading || coin.isLoading

  return (
    <Fade>
      <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
        <YStack gap={'$3.5'}>
          <XStack ai={'center'} gap={'$2'}>
            <IconCoin symbol={coin.data?.symbol || ''} size={'$2'} />
            <Paragraph size={'$7'} fontWeight={600} lineHeight={28}>
              {coin.data?.symbol || ''}
            </Paragraph>
          </XStack>
          <YStack gap={'$2'}>
            {isLoading ? (
              <Spinner size={'large'} alignSelf="flex-start" flexShrink={1} />
            ) : (
              <Paragraph
                fontWeight={'600'}
                size={(() => {
                  switch (true) {
                    case totalValue.length > 16:
                      return '$9'
                    default:
                      return '$11'
                  }
                })()}
                $gtLg={{
                  size: (() => {
                    switch (true) {
                      case totalValue.length > 16:
                        return '$9'
                      case totalValue.length > 8:
                        return '$10'
                      default:
                        return '$11'
                    }
                  })(),
                }}
                style={{
                  lineHeight: 62,
                }}
              >
                {totalValue}
              </Paragraph>
            )}
            <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          </YStack>
          {[coin.isError, coinBalances.error].some((e) => e) ? (
            <Paragraph size={'$5'} color={'$error'}>
              {[coin.error, coinBalances.error].map((e) => toNiceError(e)).join('. ')}
            </Paragraph>
          ) : (
            <Paragraph
              size={'$5'}
              color={'$lightGrayTextField'}
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              Total Value
            </Paragraph>
          )}
        </YStack>
      </Card>
    </Fade>
  )
}

/**
 * The breakdown of Send Earn deposits and earnings.
 */
function ActiveEarningBreakdown() {
  const coin = useERC20AssetCoin()
  const { coinBalances, affiliateRewards } = useSendEarnCoin(coin.data || undefined)
  const totalDeposits = useMemo(() => {
    if (!coinBalances.data) return 0n
    const totalCurrentAssets = coinBalances.data.reduce((acc, balance) => {
      return acc + balance.assets
    }, 0n)
    return totalCurrentAssets
  }, [coinBalances.data])
  const totalEarnings = useMemo(() => {
    if (!coinBalances.data) return 0n
    const totalAssets = coinBalances.data.reduce((acc, balance) => {
      return acc + balance.currentAssets
    }, 0n)
    return totalAssets - totalDeposits
  }, [coinBalances.data, totalDeposits])
  log('ActiveEarningBreakdown', {
    coinBalances,
    coin,
    totalDeposits,
    totalEarnings,
    affiliateRewards,
  })

  if ([coin.error, coinBalances.error, affiliateRewards.error].some((e) => e))
    return [coin.error, coinBalances.error, affiliateRewards.error].map((e) =>
      e ? <ErrorMessage key={e.message} error={e} /> : null
    )

  if (!coin.isSuccess || !coin.data) return null

  return (
    <Fade>
      <Card w={'100%'} p={'$5'} gap={'$6'} $gtLg={{ p: '$7' }}>
        <BreakdownRow
          symbol={coin.data.symbol}
          label={'Deposits'}
          value={formatCoinAmount({ amount: totalDeposits, coin: coin.data })}
        />
        <BreakdownRow
          symbol={coin.data.symbol}
          label={'Earnings'}
          value={formatCoinAmount({ amount: totalEarnings, coin: coin.data })}
        />
        {affiliateRewards.data && affiliateRewards.data.assets > 0n ? (
          <BreakdownRow
            symbol={coin.data.symbol}
            label={'Rewards'}
            value={formatCoinAmount({ amount: affiliateRewards.data.assets, coin: coin.data })}
          />
        ) : null}
        {/* TODO: add SEND rewards if we ever want to track them here */}
        {/* <BreakdownRow symbol={'SEND'} label={'Rewards'} value={'15,000'} /> */}
      </Card>
    </Fade>
  )
}

const ErrorMessage = ({ error }: { error: Error | undefined }) => {
  return (
    <Paragraph size={'$5'} color={'$error'}>
      {toNiceError(error)}
    </Paragraph>
  )
}

const BreakdownRow = memo(
  ({
    symbol,
    value,
    label,
  }: {
    symbol: string
    label: string
    value: string
  }) => {
    return (
      <XStack jc={'space-between'} ai={'center'} flexWrap={'wrap'} rowGap={'$3'} gap={'$3'}>
        <XStack ai={'center'} gap={'$3.5'}>
          <IconCoin symbol={symbol} size={'$2'} />
          <Paragraph size={'$7'} fontWeight={600}>
            {label}
          </Paragraph>
        </XStack>
        <Paragraph size={'$7'} fontWeight={600}>
          {value}
        </Paragraph>
      </XStack>
    )
  }
)
BreakdownRow.displayName = 'BreakdownRow'

const EarningButton = memo(
  ({
    Icon,
    label,
    href,
  }: {
    label: string
    Icon: NamedExoticComponent<IconProps>
    href: string
  }) => {
    const hoverStyles = useHoverStyles()

    return (
      <Fade flexGrow={1} flexShrink={1}>
        <Link href={href}>
          <XStack
            jc={'center'}
            py={'$3.5'}
            br={'$6'}
            backgroundColor={'$color1'}
            elevation={'$0.75'}
            hoverStyle={hoverStyles}
          >
            <Stack
              flexDirection={'column'}
              gap={'$2'}
              jc={'center'}
              ai={'center'}
              width={'100%'}
              flexWrap={Platform.OS === 'web' ? 'wrap' : undefined}
              $gtSm={{
                flexDirection: 'row',
                gap: '$3',
              }}
            >
              <Icon size={'$1.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />
              <Paragraph size={'$5'} $gtSm={{ size: '$6' }}>
                {label}
              </Paragraph>
            </Stack>
          </XStack>
        </Link>
      </Fade>
    )
  }
)
EarningButton.displayName = 'EarningButton'
