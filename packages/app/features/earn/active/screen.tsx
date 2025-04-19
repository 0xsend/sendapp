import { Card, Fade, Paragraph, Separator, Spinner, Stack, XStack, YStack } from '@my/ui'
import type { IconProps } from '@tamagui/helpers-icon'
import { ArrowDown } from '@tamagui/lucide-icons'
import { IconStarOutline, IconStacks } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { SectionButton } from 'app/features/earn/components/SectionButton'
import { formatCoinAmount } from 'app/utils/formatCoinAmount'
import { toNiceError } from 'app/utils/toNiceError'
import debug from 'debug'
import { useMemo, type NamedExoticComponent } from 'react'
import { Link } from 'solito/link'
import { useRouter } from 'solito/router'
import { useMyAffiliateRewards, useMyAffiliateVault, useSendEarnCoinBalances } from '../hooks'
import { coinToParam, useERC20AssetCoin } from '../params'

const log = debug('app:earn:active')

export function ActiveEarningsScreen() {
  return <ActiveEarnings />
}
function ActiveEarnings() {
  const { push } = useRouter()
  const coin = useERC20AssetCoin()
  const balances = useSendEarnCoinBalances(coin.data || undefined)
  const myAffiliateVault = useMyAffiliateVault()
  const isAffiliate = useMemo(
    () => !!myAffiliateVault.data?.send_earn_affiliate,
    [myAffiliateVault.data]
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

  log('ActiveEarnings', { balances, coin })

  return (
    <YStack w={'100%'} gap={'$4'} jc={'space-between'} $gtLg={{ w: '50%', pb: '$3.5' }}>
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
        onPress={() => (!coin.data ? undefined : push(`/earn/${coinToParam(coin.data)}/deposit`))}
      >
        ADD MORE DEPOSITS
      </SectionButton>
    </YStack>
  )
}

/**
 * The current total value of Send Earn deposits.
 * TODO: use token price if not USDC
 */
function TotalValue() {
  const coin = useERC20AssetCoin()
  const balances = useSendEarnCoinBalances(coin.data || undefined)
  const myEarnRewards = useMyAffiliateRewards()
  const totalValue = useMemo(() => {
    if (!balances.data) return '0'
    if (!coin.data) return '0'
    let totalAssets = balances.data.reduce((acc, balance) => {
      return acc + balance.currentAssets
    }, 0n)

    if (myEarnRewards.data) {
      totalAssets += myEarnRewards.data.assets
    }

    return formatCoinAmount({ amount: totalAssets, coin: coin.data })
  }, [balances.data, coin.data, myEarnRewards.data])

  const isLoading = balances.isLoading || coin.isLoading

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
  const coin = useERC20AssetCoin()
  const balances = useSendEarnCoinBalances(coin.data || undefined)
  const myEarnRewards = useMyAffiliateRewards()
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
  log('ActiveEarningBreakdown', { balances, coin, totalDeposits, totalEarnings, myEarnRewards })

  if ([coin.error, balances.error, myEarnRewards.error].some((e) => e))
    return [coin.error, balances.error, myEarnRewards.error].map((e) =>
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
        {myEarnRewards.data && myEarnRewards.data.assets > 0n ? (
          <BreakdownRow
            symbol={coin.data.symbol}
            label={'Rewards'}
            value={formatCoinAmount({ amount: myEarnRewards.data.assets, coin: coin.data })}
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
  return (
    <Fade flexGrow={1} flexShrink={1}>
      <Link href={href}>
        <XStack jc={'center'} px={'$5'} py={'$3.5'} br={'$6'} backgroundColor={'$color1'}>
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
      </Link>
    </Fade>
  )
}
