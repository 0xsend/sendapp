import {
  BigHeading,
  Card,
  type CardProps,
  LinkableButton,
  Paragraph,
  Spinner,
  XStack,
} from '@my/ui'
import formatAmount from 'app/utils/formatAmount'

import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'
import { useIsPriceHidden } from 'app/features/home/utils/useIsPriceHidden'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { stableCoins } from 'app/data/coins'
import { useRootScreenParams } from 'app/routers/params'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { IconPlus } from 'app/components/icons'

export const StablesBalanceCard = (props: CardProps) => {
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
      elevate
      hoverStyle={{ scale: 0.98 }}
      animation="bouncy"
      w="100%"
      onPress={toggleSubScreen}
      cursor="pointer"
      overflow="hidden"
      size={'$5'}
      br="$7"
      {...props}
    >
      <Card.Header padded jc="space-between" fd="row" ai="center">
        <Paragraph fontSize={'$5'} color={'$color12'} $gtLg={{ fontSize: '$6' }}>
          Cash Balance
        </Paragraph>
        <XStack flex={1} />

        {isStableCoin || isStablesScreen ? (
          <ChevronLeft
            size={'$1.5'}
            color={'$primary'}
            $theme-light={{ color: '$color12' }}
            $lg={{ display: 'none' }}
          />
        ) : (
          <ChevronRight size={'$1.5'} color={'$color12'} />
        )}
      </Card.Header>
      <Card.Footer padded pt={0} fd="column" gap="$4">
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
                <BigHeading
                  $platform-web={{ width: 'fit-content' }}
                  color={'$color12'}
                  fontSize={'$11'}
                  fontWeight={600}
                  zIndex={1}
                  onPress={(e) => {
                    e.stopPropagation()
                    toggleIsPriceHidden()
                  }}
                  cursor="pointer"
                >
                  ${formattedBalance}
                </BigHeading>
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
          w={'100%'}
          bc={'$color0'}
          br={'$4'}
          hoverStyle={hoverStyles}
        >
          <LinkableButton.Icon>
            <IconPlus size="$1.5" color="$color12" />
          </LinkableButton.Icon>
          <LinkableButton.Text size={'$4'}>Add Money</LinkableButton.Text>
        </LinkableButton>
      </Card.Footer>
    </Card>
  )
}
