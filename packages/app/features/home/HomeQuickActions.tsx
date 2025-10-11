import {
  ButtonText,
  LinkableButton,
  type LinkableButtonProps,
  Theme,
  XStack,
  type XStackProps,
  YStack,
  useMedia,
} from '@my/ui'
import { IconArrowUp, IconPlus, IconStacks } from 'app/components/icons'
import { usdcCoin } from 'app/data/coins'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { useSendEarnCoin } from '../earn/providers/SendEarnProvider'
import { useMemo } from 'react'

type HomeQuickActionsProps = XStackProps

export const HomeQuickActions = ({ children, ...props }: HomeQuickActionsProps) => {
  return (
    <XStack w={'100%'} gap={'$3'} $gtLg={{ gap: '$5' }} {...props}>
      {children}
    </XStack>
  )
}

const QuickActionButton = ({ href, children }: LinkableButtonProps) => {
  const hoverStyles = useHoverStyles()

  return (
    <LinkableButton
      elevation={5}
      href={href}
      f={1}
      height={'auto'}
      hoverStyle={hoverStyles}
      focusStyle={hoverStyles}
      w="100%"
    >
      {children}
    </LinkableButton>
  )
}

const Send = () => {
  const { coin } = useCoinFromTokenParam()
  const media = useMedia()
  const isSmallScreen = !media.gtXs

  const getSendUrl = () => {
    if (!coin) {
      return '/send'
    }

    return `/send?sendToken=${coin.token}`
  }

  return (
    <QuickActionButton href={getSendUrl()}>
      <YStack
        testID={'send-quick-action'}
        gap="$2"
        jc={'space-between'}
        ai="center"
        px={isSmallScreen ? '$3' : '$4'}
        py="$3.5"
        $gtSm={{ py: '$4' }}
      >
        <IconArrowUp
          size={'$1.5'}
          $theme-dark={{ color: '$primary' }}
          $theme-light={{ color: '$color12' }}
        />
        <ButtonText
          fontSize={isSmallScreen ? '$4' : '$5'}
          px="$1"
          ta="center"
          w="100%"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Send
        </ButtonText>
      </YStack>
    </QuickActionButton>
  )
}

const Trade = () => {
  const { coin } = useCoinFromTokenParam()
  const media = useMedia()
  const isSmallScreen = !media.gtXs

  const getTradeUrl = () => {
    if (!coin) {
      return '/trade'
    }

    return `/trade?inToken=${usdcCoin.token}&outToken=${coin.token}`
  }

  return (
    <QuickActionButton href={getTradeUrl()}>
      <YStack
        gap="$2"
        jc={'space-between'}
        ai="center"
        px={isSmallScreen ? '$3' : '$4'}
        py="$3.5"
        $gtSm={{ py: '$4' }}
        height={'auto'}
      >
        <Theme name="green">
          <IconPlus
            size={'$1.5'}
            $theme-dark={{ color: '$primary' }}
            $theme-light={{ color: '$color12' }}
          />
        </Theme>
        <ButtonText
          fontSize={isSmallScreen ? '$4' : '$5'}
          px="$1"
          ta="center"
          w="100%"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Invest
        </ButtonText>
      </YStack>
    </QuickActionButton>
  )
}

const Deposit = () => {
  const media = useMedia()
  const isSmallScreen = !media.gtXs

  return (
    <QuickActionButton href={'/deposit'}>
      <YStack
        gap="$2"
        jc={'space-between'}
        ai="center"
        px={isSmallScreen ? '$3' : '$4'}
        py="$3.5"
        $gtSm={{ py: '$4' }}
      >
        <IconPlus
          size={'$1.5'}
          $theme-dark={{ color: '$primary' }}
          $theme-light={{ color: '$color12' }}
        />
        <ButtonText
          fontSize={isSmallScreen ? '$4' : '$5'}
          px="$1"
          ta="center"
          w="100%"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Deposit
        </ButtonText>
      </YStack>
    </QuickActionButton>
  )
}

const Earn = () => {
  const media = useMedia()
  const isSmallScreen = !media.gtXs

  // Determine navigation target based on deposit status
  const {
    totalAssets: { totalCurrentValue },
  } = useSendEarnCoin(usdcCoin)
  const hasExistingDeposit = totalCurrentValue > 0n

  const href = useMemo(
    () => (hasExistingDeposit ? '/earn/usdc' : '/earn/usdc/deposit'),
    [hasExistingDeposit]
  )

  return (
    <QuickActionButton href={href}>
      <YStack
        gap="$2"
        jc={'space-between'}
        ai="center"
        px={isSmallScreen ? '$3' : '$4'}
        py="$3.5"
        $gtSm={{ py: '$4' }}
      >
        <IconStacks
          size={'$1.5'}
          $theme-dark={{ color: '$primary' }}
          $theme-light={{ color: '$color12' }}
        />
        <ButtonText
          fontSize={isSmallScreen ? '$4' : '$5'}
          px="$1"
          ta="center"
          w="100%"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Earn
        </ButtonText>
      </YStack>
    </QuickActionButton>
  )
}

HomeQuickActions.Deposit = Deposit
HomeQuickActions.Send = Send
HomeQuickActions.Trade = Trade
HomeQuickActions.Earn = Earn
