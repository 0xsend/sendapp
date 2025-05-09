import {
  BigHeading,
  Button,
  Card,
  LinkableButton,
  Paragraph,
  Spinner,
  XStack,
  YStack,
} from '@my/ui'
import formatAmount from 'app/utils/formatAmount'

import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'
import { useIsPriceHidden } from 'app/features/home/utils/useIsPriceHidden'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { stableCoins } from 'app/data/coins'
import { useRootScreenParams } from 'app/routers/params'
import { useHoverStyles } from 'app/utils/useHoverStyles'

export const StablesBalanceCard = () => {
  const hoverStyles = useHoverStyles()
  const { isPriceHidden, toggleIsPriceHidden } = useIsPriceHidden()

  const [queryParams, setParams] = useRootScreenParams()
  const isStableCoin = stableCoins.some(
    (coin) => coin.token.toLowerCase() === queryParams.token?.toLowerCase()
  )
  const isStablesScreen = queryParams.token === 'stables'

  const { dollarBalances, pricesQuery } = useSendAccountBalances()
  const dollarTotal = Object.entries(dollarBalances ?? {})
    .filter(([address]) =>
      stableCoins.some((coin) => coin.token.toLowerCase() === address.toLowerCase())
    )
    .reduce((total, [, balance]) => total + balance, 0)
  const formattedBalance = formatAmount(dollarTotal, 9, 0)

  const toggleSubScreen = () =>
    setParams(
      { ...queryParams, token: queryParams.token === 'stables' ? undefined : 'stables' },
      { webBehavior: 'push' }
    )

  return (
    <Card
      py={'$5'}
      px="$4"
      w={'100%'}
      jc="space-between"
      onPress={toggleSubScreen}
      cursor="pointer"
    >
      <XStack w={'100%'} zIndex={4}>
        <YStack jc={'center'} gap={'$4'} w={'100%'}>
          <YStack w={'100%'} gap={'$2.5'} jc="space-between">
            <XStack ai={'center'} jc={'space-between'} gap="$2.5" width={'100%'}>
              <Paragraph
                fontSize={'$5'}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
                $gtLg={{ fontSize: '$6' }}
              >
                Cash Balance
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
                  {isStableCoin || isStablesScreen ? (
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
          <YStack>
            {(() => {
              switch (true) {
                case isPriceHidden:
                  return (
                    <BigHeading
                      $platform-web={{ width: 'fit-content' }}
                      fontWeight={600}
                      color={'$color12'}
                      zIndex={1}
                      $gtSm={{ fontSize: 96, lineHeight: 96 }}
                      onPress={(e) => {
                        e.stopPropagation()
                        toggleIsPriceHidden()
                      }}
                    >
                      {'///////'}
                    </BigHeading>
                  )
                case pricesQuery.isLoading || !dollarBalances:
                  return <Spinner size={'large'} />
                default:
                  return (
                    <>
                      <BigHeading
                        $platform-web={{ width: 'fit-content' }}
                        color={'$color12'}
                        fontSize={'$11'}
                        fontWeight={600}
                        zIndex={1}
                        $gtSm={{
                          fontSize: 96,
                          lineHeight: 96,
                        }}
                        onPress={(e) => {
                          e.stopPropagation()
                          toggleIsPriceHidden()
                        }}
                      >
                        ${formattedBalance}
                      </BigHeading>
                    </>
                  )
              }
            })()}
            <LinkableButton
              als="flex-end"
              onPress={(e) => {
                e.stopPropagation()
              }}
              href="/deposit"
              p={'$4'}
              w={176}
              bc={'$color0'}
              br={'$4'}
              hoverStyle={hoverStyles}
            >
              <Button.Text size={'$4'}>Add Money</Button.Text>
            </LinkableButton>
          </YStack>
        </YStack>
      </XStack>
    </Card>
  )
}
