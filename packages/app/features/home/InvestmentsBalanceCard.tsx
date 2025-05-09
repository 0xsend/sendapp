import { Button, Card, Paragraph, Spinner, XStack, YStack } from '@my/ui'
import formatAmount from 'app/utils/formatAmount'

import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'

import { useIsPriceHidden } from './utils/useIsPriceHidden'

import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { investmentCoins } from 'app/data/coins'

import { useRootScreenParams } from 'app/routers/params'

export const InvestmentsBalanceCard = () => {
  const [queryParams, setParams] = useRootScreenParams()
  const isInvestmentCoin = investmentCoins.some(
    (coin) => coin.token.toLowerCase() === queryParams.token
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
    <Card p="$6" w={'100%'} jc="space-between" onPress={toggleSubScreen}>
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

        {/*
          @TODO add daily percent increase
          <Paragraph fontSize={'$4'} color={'$color10'}>
            +12%
          </Paragraph> */}
      </YStack>
    </Card>
  )
}
