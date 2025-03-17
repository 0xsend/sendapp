import { Card, Fade, Paragraph, Separator, Spinner, Stack, XStack, YStack } from '@my/ui'
import type { IconProps } from '@tamagui/helpers-icon'
import { ArrowDown } from '@tamagui/lucide-icons'
import { IconStacks } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { SectionButton } from 'app/features/earn/components/SectionButton'
import { formatCoinAmount } from 'app/utils/formatCoinAmount'
import { toNiceError } from 'app/utils/toNiceError'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import debug from 'debug'
import { useMemo, type NamedExoticComponent } from 'react'
import { useRouter } from 'solito/router'
import { useMyAffiliateVault, useMyEarnRewards, useSendEarnCoinBalances } from '../hooks'
import { coinToParam, useERC20CoinAsset } from '../params'

const log = debug('app:earn:active')

export const ActiveEarnings = () => {
  const { push } = useRouter()
  const coin = useERC20CoinAsset()
  const balances = useSendEarnCoinBalances(coin.data || undefined)

  const buttons: {
    Icon: NamedExoticComponent<IconProps>
    label: string
    href: string
  }[] = useMemo(() => {
    if (!coin || !coin.data) return []
    return [
      {
        Icon: ArrowDown,
        label: 'Withdraw',
        href: `/earn/${coin.data.symbol.toLowerCase()}/withdraw`,
      },
      {
        Icon: IconStacks,
        label: 'Earnings',
        href: `/earn/${coin.data.symbol.toLowerCase()}/balance`,
      },
      // {
      //   Icon: IconSendSingleLetter,
      //   label: 'Rewards',
      //   href: `/earn/${coin.data.symbol}/rewards`,
      // },
    ]
  }, [coin])

  if (!coin.isLoading && !coin.data) {
    push('/earn')
    return null
  }

  log('ActiveEarnings', { balances, coin })

  return (
    <YStack w={'100%'} gap={'$4'} pb={'$3'} jc={'space-between'} $gtLg={{ w: '50%' }}>
      <YStack w={'100%'} gap={'$4'}>
        <TotalValue />
        <XStack flexGrow={1} gap={'$3.5'}>
          {buttons.map(({ Icon, label, href }) => (
            <EarningButton Icon={Icon} label={label} href={href} key={href} />
          ))}
        </XStack>
        <ActiveEarningBreakdown />
      </YStack>
      <SectionButton
        text={'ADD MORE DEPOSITS'}
        onPress={() => (!coin.data ? undefined : push(`/earn/${coinToParam(coin.data)}/deposit`))}
      />
    </YStack>
  )
}

/**
 * The current total value of Send Earn deposits.
 * TODO: use token price if not USDC
 */
function TotalValue() {
  const coin = useERC20CoinAsset()
  const balances = useSendEarnCoinBalances(coin.data || undefined)
  const totalValue = useMemo(() => {
    if (!balances.data) return '0'
    if (!coin.data) return '0'
    const totalAssets = balances.data.reduce((acc, balance) => {
      return acc + balance.currentAssets
    }, 0n)
    return formatCoinAmount({ amount: totalAssets, coin: coin.data })
  }, [balances.data, coin.data])
  const myAffiliateVault = useMyAffiliateVault()
  log('myAffiliateVault', myAffiliateVault)
  const myEarnRewards = useMyEarnRewards()
  log('myEarnRewards', myEarnRewards)

  const isLoading = balances.isPending || coin.isPending

  log('TotalValue', { totalValue, coin, balances, isLoading })
  return (
    <Fade>
      <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
        <YStack gap={'$4'}>
          <XStack ai={'center'} gap={'$2'}>
            <IconCoin symbol={coin.data?.symbol || ''} size={'$2'} />
            <Paragraph size={'$7'}>{coin.data?.symbol || ''}</Paragraph>
          </XStack>
          <YStack gap={'$2'}>
            {isLoading ? (
              <Spinner size={'large'} alignSelf="flex-start" flexShrink={1} />
            ) : (
              <Paragraph
                fontWeight={'500'}
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
              >
                {totalValue}
              </Paragraph>
            )}
          </YStack>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          {[coin.isError, balances.isError].some((e) => e) ? (
            <Paragraph size={'$5'} color={'$error'}>
              {[coin.error, balances.error].map((e) => toNiceError(e)).join('. ')}
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
  const coin = useERC20CoinAsset()
  const balances = useSendEarnCoinBalances(coin.data || undefined)
  const totalDeposits = useMemo(() => {
    if (!balances.data) return 0n
    const totalCurrentAssets = balances.data.reduce((acc, balance) => {
      return acc + balance.assets
    }, 0n)
    return totalCurrentAssets
  }, [balances.data])
  const totalEarnings = useMemo(() => {
    if (!balances.data) return 0n
    const totalAssets = balances.data.reduce((acc, balance) => {
      return acc + balance.currentAssets
    }, 0n)
    return totalAssets - totalDeposits
  }, [balances.data, totalDeposits])

  if (!balances.isSuccess || !coin.isSuccess || !coin.data) return null
  log('ActiveEarningBreakdown', { balances, coin, totalDeposits, totalEarnings })
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
        {/* <BreakdownRow symbol={'SEND'} label={'Rewards'} value={'15,000'} /> */}
      </Card>
    </Fade>
  )
}

const BreakdownRow = ({
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
        <Paragraph size={'$7'}>{label}</Paragraph>
      </XStack>
      <Paragraph size={'$7'}>{value}</Paragraph>
    </XStack>
  )
}

const EarningButton = ({
  Icon,
  label,
  href,
}: {
  label: string
  Icon: NamedExoticComponent<IconProps>
  href: string
}) => {
  const router = useRouter()
  const hoverStyles = useHoverStyles()

  const handleOnPress = () => {
    router.push(href)
  }

  return (
    <Fade flexGrow={1} flexShrink={1}>
      <XStack
        jc={'center'}
        px={'$5'}
        py={'$3.5'}
        br={'$6'}
        backgroundColor={'$color1'}
        onPress={handleOnPress}
        hoverStyle={hoverStyles}
      >
        <Stack
          flexDirection={'column'}
          gap={'$2'}
          jc={'center'}
          ai={'center'}
          width={'100%'}
          flexWrap={'wrap'}
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
    </Fade>
  )
}
