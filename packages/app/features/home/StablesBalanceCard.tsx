import {
  BigHeading,
  BlurStack,
  Card,
  type CardProps,
  LinkableButton,
  Paragraph,
  Spinner,
  withStaticProperties,
  XStack,
} from '@my/ui'
import formatAmount from 'app/utils/formatAmount'

import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'
import { useIsPriceHidden } from 'app/features/home/utils/useIsPriceHidden'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { stableCoins, usdcCoin } from 'app/data/coins'
import { useRootScreenParams } from 'app/routers/params'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { IconArrowUp, IconPlus } from 'app/components/icons'
import { useThemeSetting } from 'app/provider/theme'
import { Platform } from 'react-native'
import { useRouter } from 'solito/router'

const StablesBalanceCardHeader = () => {
  const [queryParams] = useRootScreenParams()

  const isStableCoin = stableCoins.some(
    (coin) => coin.token.toLowerCase() === queryParams.token?.toLowerCase()
  )
  const isStablesScreen = queryParams.token === 'stables'

  return (
    <Card.Header padded size="$4" pb={0} jc="space-between" fd="row">
      <Paragraph fontSize={'$6'} fontWeight={300} color={'$color12'} $gtLg={{ fontSize: '$6' }}>
        Cash Balance
      </Paragraph>
      <XStack flex={1} />
      {isStableCoin || isStablesScreen ? (
        <ChevronLeft
          size={'$1'}
          color={'$primary'}
          $theme-light={{ color: '$color12' }}
          $lg={{ display: 'none' }}
        />
      ) : (
        <ChevronRight size={'$1'} color={'$color12'} />
      )}
    </Card.Header>
  )
}

const StablesBalanceCardFooter = () => {
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')
  const hoverStyles = useHoverStyles()
  const { isPriceHidden, toggleIsPriceHidden } = useIsPriceHidden()
  const [queryParams] = useRootScreenParams()

  const { dollarBalances, pricesQuery } = useSendAccountBalances()
  const dollarTotal = Object.entries(dollarBalances ?? {})
    .filter(([address]) =>
      stableCoins.some((coin) => coin.token.toLowerCase() === address.toLowerCase())
    )
    .reduce((total, [, balance]) => total + balance, 0)
  const formattedBalance = formatAmount(dollarTotal, 9, 0)

  const usdcBalance = dollarBalances?.[usdcCoin.token] ?? 0
  const shouldShowSendButton = usdcBalance >= 0.5

  return (
    <Card.Footer padded size="$4" fd="column" gap="$4">
      {(() => {
        switch (true) {
          case isPriceHidden:
            return (
              <BigHeading
                $platform-web={{ width: 'fit-content' }}
                fontWeight={600}
                color={'$color12'}
                zIndex={1}
                fontSize={'$11'}
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
      <XStack gap="$2.5" w="100%">
        <LinkableButton
          href="/deposit"
          jc="center"
          ai="center"
          f={1}
          w="100%"
          borderRadius="$4"
          hoverStyle={hoverStyles}
          bc={isDarkTheme ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.10)'}
        >
          <XStack gap="$1.5" ai="center">
            <LinkableButton.Icon>
              <IconPlus size="$1" color={isDarkTheme ? '$primary' : '$color12'} />
            </LinkableButton.Icon>
            <LinkableButton.Text size={'$5'}>Add Money</LinkableButton.Text>
          </XStack>
          <BlurStack fullscreen intensity={10} zIndex={-1} br={'$3'} />
        </LinkableButton>
        {shouldShowSendButton && (
          <LinkableButton
            href={`/send?sendToken=${queryParams.token ?? ''}`}
            jc="center"
            ai="center"
            f={1}
            w="100%"
            borderRadius="$4"
            hoverStyle={hoverStyles}
            bc={isDarkTheme ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.10)'}
          >
            <XStack gap="$1.5" ai="center">
              <LinkableButton.Icon>
                <IconArrowUp size={'$1'} color={isDarkTheme ? '$primary' : '$color12'} />
              </LinkableButton.Icon>
              <LinkableButton.Text size={'$5'}>Send</LinkableButton.Text>
            </XStack>
            <BlurStack fullscreen intensity={10} zIndex={-1} br={'$3'} />
          </LinkableButton>
        )}
      </XStack>
    </Card.Footer>
  )
}

export const StablesBalanceCardContent = (props: CardProps) => {
  const [queryParams, setParams] = useRootScreenParams()
  const router = useRouter()

  const toggleSubScreen = () => {
    if (Platform.OS === 'web') {
      setParams({ ...queryParams, token: 'stables' }, { webBehavior: 'push' })
      return
    }

    router.push('/stables')
  }

  return (
    <Card
      w="100%"
      onPress={toggleSubScreen}
      cursor="pointer"
      overflow="hidden"
      size={'$5'}
      br="$7"
      {...props}
    >
      {props.children}
    </Card>
  )
}

export const StablesBalanceCard = withStaticProperties(StablesBalanceCardContent, {
  Header: StablesBalanceCardHeader,
  Footer: StablesBalanceCardFooter,
})
