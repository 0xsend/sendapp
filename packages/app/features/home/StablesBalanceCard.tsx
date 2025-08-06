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
import { baseMainnet, usdcAddress } from '@my/wagmi'
import type { PropsWithChildren } from 'react'

const StablesBalanceCardHomeScreenHeader = () => {
  const [queryParams] = useRootScreenParams()

  const isStableCoin = stableCoins.some(
    (coin) => coin.token.toLowerCase() === queryParams.token?.toLowerCase()
  )
  const isStablesScreen = queryParams.token === 'stables'

  return (
    <Card.Header padded size="$4" pb={0} jc="space-between" fd="row">
      <Paragraph
        fontSize={'$5'}
        fontWeight={300}
        color={'$lightGrayTextField'}
        $theme-light={{ color: '$darkGrayTextField' }}
      >
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
        <ChevronRight
          size={'$1'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        />
      )}
    </Card.Header>
  )
}

const StablesBalanceCardStablesScreenHeader = () => {
  return (
    <Card.Header padded size="$4" pb={0} jc="space-between" fd="row">
      <Paragraph
        fontSize={'$5'}
        fontWeight={300}
        color={'$lightGrayTextField'}
        $theme-light={{ color: '$darkGrayTextField' }}
      >
        Total Balance
      </Paragraph>
    </Card.Header>
  )
}

const StablesBalanceCardFooter = ({ children }: PropsWithChildren) => {
  return (
    <Card.Footer padded size="$4" fd="column" gap="$4">
      {children}
    </Card.Footer>
  )
}

const StablesBalanceCardBalance = () => {
  const { isPriceHidden, toggleIsPriceHidden } = useIsPriceHidden()

  const { dollarBalances, pricesQuery } = useSendAccountBalances()
  const dollarTotal = Object.entries(dollarBalances ?? {})
    .filter(([address]) =>
      stableCoins.some((coin) => coin.token.toLowerCase() === address.toLowerCase())
    )
    .reduce((total, [, balance]) => total + balance, 0)
  const formattedBalance = formatAmount(dollarTotal, 9, 0)

  if (isPriceHidden) {
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
  }

  if (pricesQuery.isLoading || !dollarBalances) {
    return <Spinner size={'large'} />
  }

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

const StablesBalanceCardActions = () => {
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')
  const hoverStyles = useHoverStyles()
  const [queryParams] = useRootScreenParams()

  const { dollarBalances } = useSendAccountBalances()

  const usdcBalance = dollarBalances?.[usdcCoin.token] ?? 0
  const shouldShowSendButton = usdcBalance >= 0.5

  return (
    <XStack gap="$2.5" w="100%">
      <LinkableButton
        href="/deposit"
        jc="center"
        ai="center"
        f={1}
        w="100%"
        overflow={'hidden'}
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
          href={`/send?sendToken=${queryParams.token ?? usdcAddress[baseMainnet.id]}`}
          jc="center"
          ai="center"
          overflow={'hidden'}
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
      size={'$5'}
      br="$7"
      p={'$1.5'}
      {...props}
    >
      {props.children}
    </Card>
  )
}

export const StablesBalanceCard = withStaticProperties(StablesBalanceCardContent, {
  HomeScreenHeader: StablesBalanceCardHomeScreenHeader,
  StablesScreenHeader: StablesBalanceCardStablesScreenHeader,
  Footer: StablesBalanceCardFooter,
  Balance: StablesBalanceCardBalance,
  Actions: StablesBalanceCardActions,
})
