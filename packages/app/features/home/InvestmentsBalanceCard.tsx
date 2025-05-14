import { Button, Card, Paragraph, Spinner, Theme, XStack, YStack } from '@my/ui'
import formatAmount from 'app/utils/formatAmount'

import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'

import { useIsPriceHidden } from './utils/useIsPriceHidden'

import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { investmentCoins } from 'app/data/coins'

import { useRootScreenParams } from 'app/routers/params'
import { useMultipleTokensMarketData } from 'app/utils/coin-gecko'
import { useMemo } from 'react'
import { IconError } from 'app/components/icons'
import { useCoins } from 'app/provider/coins'

export const InvestmentsBalanceCard = () => {
  const [queryParams, setParams] = useRootScreenParams()
  const isInvestmentCoin = investmentCoins.some(
    (coin) => coin.token.toLowerCase() === queryParams.token?.toLowerCase()
  )
  const isInvestmentsScreen = queryParams.token === 'investments'

  const toggleSubScreen = () =>
    setParams(
      { ...queryParams, token: queryParams.token === 'investments' ? undefined : 'investments' },
      { webBehavior: 'push' }
    )

  const { isPriceHidden } = useIsPriceHidden()

  const { dollarBalances, isLoading } = useSendAccountBalances()
  const dollarTotal = Object.entries(dollarBalances ?? {})
    .filter(([address]) =>
      investmentCoins.some((coin) => coin.token.toLowerCase() === address.toLowerCase())
    )
    .reduce((total, [, balance]) => total + balance, 0)

  const formattedBalance = formatAmount(dollarTotal, 9, 0)

  return (
    <Card py="$5" px="$4" w={'100%'} jc="space-between" onPress={toggleSubScreen}>
      <YStack jc={'center'} gap={'$5'} w={'100%'}>
        <YStack w={'100%'} gap={'$2.5'} jc="space-between">
          <XStack ai={'center'} jc={'space-between'} gap="$2.5" width={'100%'}>
            <Paragraph fontSize={'$7'} fontWeight="400">
              Invest
            </Paragraph>
            <Button
              chromeless
              backgroundColor="transparent"
              hoverStyle={{ backgroundColor: 'transparent' }}
              pressStyle={{
                backgroundColor: 'transparent',
                borderColor: 'transparent',
              }}
              focusStyle={{ backgroundColor: 'transparent' }}
              p={0}
              height={'auto'}
            >
              <Button.Icon>
                {isInvestmentCoin || isInvestmentsScreen ? (
                  <ChevronLeft
                    size={'$1.5'}
                    color={'$lightGrayTextField'}
                    $theme-light={{ color: '$darkGrayTextField' }}
                    $lg={{ display: 'none' }}
                  />
                ) : (
                  <ChevronRight
                    size={'$1.5'}
                    color={'$primary'}
                    $theme-light={{ color: '$color12' }}
                  />
                )}
              </Button.Icon>
            </Button>
          </XStack>
        </YStack>
        <Paragraph fontSize={'$10'} fontWeight={'600'} color={'$color12'}>
          {(() => {
            switch (true) {
              case isPriceHidden:
                return '///////'
              case isLoading || !dollarBalances:
                return <Spinner size={'large'} />
              default:
                return `$${formattedBalance}`
            }
          })()}
        </Paragraph>
        <InvestmentsAggregate />
      </YStack>
    </Card>
  )
}

function InvestmentsAggregate() {
  const tokenIds = useCoins()
    .investmentCoins.filter((c) => c?.balance && c.balance > 0n)
    .map((c) => c.coingeckoTokenId)

  const { data: marketData, isLoading, isError } = useMultipleTokensMarketData(tokenIds)
  const aggregatePercentage = useMemo(() => {
    if (!marketData?.length) return 0

    // Simple average of percentage changes
    const aggregatePercentage =
      marketData.reduce((total, coin) => {
        return total + (coin?.price_change_percentage_24h ?? 0)
      }, 0) / marketData.length

    return Number(aggregatePercentage.toFixed(2))
  }, [marketData])

  if (tokenIds.length === 0)
    return (
      <XStack gap="$2" ai="center">
        <Paragraph color="$color10" $gtXs={{ fontSize: 14 }} fontSize={12}>
          Add popular crypto assets to your portfolio
        </Paragraph>
      </XStack>
    )

  if (isLoading) return <Spinner size="small" />

  if (isError)
    return (
      <XStack gap="$2" ai="center">
        <Paragraph color="$color10" $gtXs={{ fontSize: 14 }} fontSize={12}>
          Failed to load market data
        </Paragraph>
        <IconError size="$1.5" color={'$error'} />
      </XStack>
    )

  if (aggregatePercentage > 0)
    return (
      <Theme name={'green_active'}>
        <Paragraph fontSize={'$4'}>+{aggregatePercentage}%</Paragraph>
      </Theme>
    )
  if (aggregatePercentage < 0)
    return (
      <Theme name={'red_active'}>
        <Paragraph fontSize={'$4'}>{aggregatePercentage}%</Paragraph>
      </Theme>
    )
  return (
    <Paragraph fontSize={'$4'} color="$color10">
      {aggregatePercentage}%
    </Paragraph>
  )
}
