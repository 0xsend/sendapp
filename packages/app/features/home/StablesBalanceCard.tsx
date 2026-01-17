import {
  AnimatePresence,
  BigHeading,
  BlurStack,
  Card,
  type CardProps,
  LinkableButton,
  Paragraph as NotMemoizedParagraph,
  type ParagraphProps,
  Shimmer,
  useEvent,
  useMedia,
  View,
  withStaticProperties,
  XStack,
} from '@my/ui'
import formatAmount from 'app/utils/formatAmount'

import { ChevronRight as NotMemoizedChevronRight } from '@tamagui/lucide-icons'
import { useIsPriceHidden } from 'app/features/home/utils/useIsPriceHidden'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { useUSDCBalance } from 'app/utils/useUSDCBalance'
import { stableCoins } from 'app/data/coins'
import { useRootScreenParams } from 'app/routers/params'
import { IconArrowUp, IconPlus } from 'app/components/icons'
import { useThemeSetting } from 'app/provider/theme'
import { type NativeTouchEvent, type NativeSyntheticEvent, Platform } from 'react-native'
import { useRouter } from 'solito/router'
import { baseMainnet, sendTokenAddress } from '@my/wagmi'
import { memo, useMemo, type PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'

const ChevronRight = memo(NotMemoizedChevronRight)
ChevronRight.displayName = 'ChevronRight'

const Paragraph = (props: ParagraphProps) => {
  return <NotMemoizedParagraph {...props} />
}
Paragraph.displayName = 'WrappedParagraph'

const StablesBalanceCardHomeScreenHeader = () => {
  const [queryParams] = useRootScreenParams()
  const { t } = useTranslation('home')

  const isStableCoin = stableCoins.some(
    (coin) => coin.token.toLowerCase() === queryParams.token?.toLowerCase()
  )
  const isStablesScreen = queryParams.token === 'stables'

  const isChevronLeft = isStableCoin || isStablesScreen

  const chevronRightProps = useMemo(() => {
    return {
      '$theme-light': { color: isChevronLeft ? '$color12' : '$darkGrayTextField' },
      $lg: { display: isChevronLeft ? 'none' : 'flex' },
    } as const
  }, [isChevronLeft])

  return (
    <Card.Header padded size="$4" pb={0} jc="space-between" fd="row">
      <Paragraph
        fontSize={'$5'}
        fontWeight={300}
        color={'$lightGrayTextField'}
        $theme-light={{ color: '$darkGrayTextField' }}
      >
        {t('cards.stables.title')}
      </Paragraph>
      <XStack flex={1} />
      <View animateOnly={['transform']} animation="fast" rotate={isChevronLeft ? '180deg' : '0deg'}>
        <ChevronRight
          size="$1"
          color={isChevronLeft ? '$primary' : '$lightGrayTextField'}
          {...chevronRightProps}
        />
      </View>
    </Card.Header>
  )
}

const StablesBalanceCardStablesScreenHeader = () => {
  const { t } = useTranslation('home')

  return (
    <Card.Header padded size="$4" pb={0} jc="space-between" fd="row">
      <Paragraph
        fontSize={'$5'}
        fontWeight={300}
        color={'$lightGrayTextField'}
        $theme-light={{ color: '$darkGrayTextField' }}
      >
        {t('cards.stables.totalTitle')}
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
  const { isPriceHidden, isPriceHiddenLoading, toggleIsPriceHidden } = useIsPriceHidden()

  const { dollarBalances, isLoading } = useSendAccountBalances()

  const onPress = useEvent((e) => {
    e.stopPropagation()
    toggleIsPriceHidden()
  })

  const formattedBalance = useMemo(() => {
    const total = Object.entries(dollarBalances ?? {})
      .filter(([address]) =>
        stableCoins.some((coin) => coin.token.toLowerCase() === address.toLowerCase())
      )
      .reduce((sum, [, balance]) => sum + balance, 0)
    return formatAmount(total, 9, 0)
  }, [dollarBalances])

  if (isPriceHidden && !isPriceHiddenLoading) {
    return (
      <BigHeading
        $platform-web={{ width: 'fit-content' }}
        fontWeight={600}
        color="$aztec11"
        zIndex={1}
        fontSize={'$11'}
        onPress={onPress}
      >
        ******
      </BigHeading>
    )
  }

  return (
    <AnimatePresence initial={false}>
      {isLoading ? (
        <View w={80} h={64} o={1} zi={1}>
          <Shimmer br={5} />
        </View>
      ) : (
        <BalanceValue onPress={onPress} formattedBalance={formattedBalance} />
      )}
    </AnimatePresence>
  )
}

type BalanceValueProps = {
  onPress: (e: NativeSyntheticEvent<NativeTouchEvent>) => void
  formattedBalance: string
}

const BalanceValue = ({ onPress, formattedBalance }: BalanceValueProps) => {
  return (
    <BigHeading
      animateOnly={['opacity']}
      animation="fast"
      enterStyle={{ opacity: 0.6 }}
      $platform-web={{ width: 'fit-content' }}
      color={'$color12'}
      fontSize={'$11'}
      fontWeight={600}
      zIndex={1}
      onPress={onPress}
      cursor="pointer"
    >
      ${formattedBalance}
    </BigHeading>
  )
}

const StablesBalanceCardActions = () => {
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')
  const { t } = useTranslation('home')

  return (
    <XStack gap="$2.5" w="100%">
      <LinkableButton
        prefetch
        href="/deposit"
        jc="center"
        ai="center"
        f={1}
        w="100%"
        overflow={'hidden'}
        borderRadius="$4"
        bc={isDarkTheme ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.10)'}
      >
        <XStack gap="$1.5" ai="center">
          <LinkableButton.Icon>
            <IconPlus size="$1" color={isDarkTheme ? '$primary' : '$color12'} />
          </LinkableButton.Icon>
          <LinkableButton.Text size={'$5'}>{t('actions.addMoney')}</LinkableButton.Text>
        </XStack>
        <BlurStack fullscreen intensity={10} zIndex={-1} br={'$3'} />
      </LinkableButton>
      <SendButton />
    </XStack>
  )
}

const SendButton = () => {
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')
  const [queryParams] = useRootScreenParams()
  const { balance: usdcBalance } = useUSDCBalance()
  const { t } = useTranslation('home')

  const shouldShowSendButton = usdcBalance >= 0.5
  return (
    shouldShowSendButton && (
      <LinkableButton
        prefetch
        href={`/send?sendToken=${queryParams.token ?? sendTokenAddress[baseMainnet.id]}`}
        jc="center"
        ai="center"
        overflow={'hidden'}
        f={1}
        w="100%"
        borderRadius="$4"
        bc={isDarkTheme ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.10)'}
      >
        <XStack gap="$1.5" ai="center">
          <LinkableButton.Icon>
            <IconArrowUp size={'$1'} color={isDarkTheme ? '$primary' : '$color12'} />
          </LinkableButton.Icon>
          <LinkableButton.Text size={'$5'}>{t('actions.send')}</LinkableButton.Text>
        </XStack>
        <BlurStack fullscreen intensity={10} zIndex={-1} br={'$3'} />
      </LinkableButton>
    )
  )
}

export const StablesBalanceCardContent = (props: CardProps) => {
  const [queryParams, setParams] = useRootScreenParams()
  const router = useRouter()
  const { gtMd } = useMedia()

  const toggleSubScreen = useEvent(() => {
    if (Platform.OS === 'web') {
      setParams(
        {
          ...queryParams,
          token: queryParams.token === 'stables' && gtMd ? undefined : 'stables',
        },
        { webBehavior: 'push' }
      )
      return
    }

    router.push('/stables')
  })

  return <StablesBalanceCardInner onPress={toggleSubScreen} {...props} />
}

const StablesBalanceCardInnerImpl = (props: CardProps) => {
  return (
    <Card
      w="100%"
      size={'$5'}
      br="$7"
      p={'$1.5'}
      materialInteractive={process.env.TAMAGUI_TARGET === 'web'}
      {...props}
    >
      {props.children}
    </Card>
  )
}

const StablesBalanceCardInner = memo(StablesBalanceCardInnerImpl)

StablesBalanceCardInner.displayName = 'StablesBalanceCardInner'

export const StablesBalanceCard = withStaticProperties(StablesBalanceCardContent, {
  HomeScreenHeader: StablesBalanceCardHomeScreenHeader,
  StablesScreenHeader: StablesBalanceCardStablesScreenHeader,
  Footer: StablesBalanceCardFooter,
  Balance: StablesBalanceCardBalance,
  Actions: StablesBalanceCardActions,
})
