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

export const StablesBalanceCard = () => {
  const [queryParams, setParams] = useRootScreenParams()
  const isStableCoin = stableCoins.some((coin) => coin.token.toLowerCase() === queryParams.token)
  const isStablesScreen = queryParams.token === 'stables'

  const { dollarBalances, pricesQuery } = useSendAccountBalances()
  const dollarTotal = Object.entries(dollarBalances ?? {})
    .filter(([address]) =>
      stableCoins.some((coin) => coin.token.toLowerCase() === address.toLowerCase())
    )
    .reduce((total, [, balance]) => total + balance, 0)
  const formattedBalance = formatAmount(dollarTotal, 9, 0)

  const { isPriceHidden, toggleIsPriceHidden } = useIsPriceHidden()

  const toggleSubScreen = () =>
    setParams(
      { ...queryParams, token: queryParams.token === 'stables' ? undefined : 'stables' },
      { webBehavior: 'push' }
    )

  return (
    <Card p={'$6'} w={'100%'} jc="space-between" onPress={toggleSubScreen}>
      <XStack w={'100%'} zIndex={4}>
        <YStack jc={'center'} gap={'$5'} w={'100%'} $gtLg={{ gap: '$6' }}>
          <YStack w={'100%'} gap={'$2.5'} jc="space-between">
            <XStack ai={'center'} jc={'space-between'} gap="$2.5" width={'100%'}>
              <Paragraph
                fontSize={'$5'}
                color={'$lightGrayTextField'}
                $theme-light={{ color: '$darkGrayTextField' }}
                zIndex={1}
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
          <XStack
            style={{ color: 'white' }}
            gap={'$2.5'}
            onPress={(e) => {
              e.stopPropagation()
              toggleIsPriceHidden()
            }}
          >
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
                      >
                        ${formattedBalance}
                      </BigHeading>
                    </>
                  )
              }
            })()}
          </XStack>
          <LinkableButton
            href="/deposit"
            als="flex-start"
            p={'$4'}
            w={176}
            bc={'$color0'}
            br={'$4'}
          >
            <Button.Text size={'$4'}>Add Money</Button.Text>
          </LinkableButton>
        </YStack>
      </XStack>
    </Card>
  )
}
