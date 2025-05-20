import {
  ButtonText,
  LinkableButton,
  type LinkableButtonProps,
  Theme,
  XStack,
  type XStackProps,
  YStack,
} from '@my/ui'
import { IconArrowUp, IconPlus, IconStacks, IconSwap } from 'app/components/icons'
import { sendCoin, usdcCoin } from 'app/data/coins'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useMemo } from 'react'
import { Platform } from 'react-native'

type HomeQuickActionsProps = XStackProps

export const HomeQuickActions = ({ children, ...props }: HomeQuickActionsProps) => {
  return (
    <XStack width="100%" gap="$3" {...props}>
      {children}
    </XStack>
  )
}

const QuickActionButton = ({ href, children }: LinkableButtonProps) => {
  // On native, we don't need hover styles, but we need consistent styling
  return (
    <LinkableButton href={href} f={1} height={'auto'} w="100%" pressStyle={{ opacity: 0.8 }}>
      {children}
    </LinkableButton>
  )
}

const Send = () => {
  const { coin } = useCoinFromTokenParam()

  const getSendUrl = useMemo(() => {
    if (!coin) {
      return '/send'
    }
    return `/send?sendToken=${coin.token}`
  }, [coin])

  return (
    <QuickActionButton href={getSendUrl}>
      <YStack
        testID={'send-quick-action'}
        gap="$2"
        jc={'space-between'}
        ai="center"
        px="$3"
        py="$3.5"
      >
        <IconArrowUp
          size={'$1.5'}
          $theme-dark={{ color: '$primary' }}
          $theme-light={{ color: '$color12' }}
        />
        <ButtonText
          fontSize="$4"
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

const Invest = () => {
  const { coin } = useCoinFromTokenParam()

  const getTradeUrl = useMemo(() => {
    if (!coin) {
      return '/trade'
    }
    return `/trade?inToken=${usdcCoin.token}&outToken=${coin.token}`
  }, [coin])

  return (
    <QuickActionButton href={getTradeUrl}>
      <YStack gap="$2" jc={'space-between'} ai="center" px="$3" py="$3.5" height={'auto'}>
        <Theme name="green">
          <IconPlus
            size={'$1.5'}
            $theme-dark={{ color: '$primary' }}
            $theme-light={{ color: '$color12' }}
          />
        </Theme>
        <ButtonText
          fontSize="$4"
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
  return (
    <QuickActionButton href={'/deposit'}>
      <YStack gap="$2" jc={'space-between'} ai="center" px="$3" py="$3.5">
        <IconPlus
          size={'$1.5'}
          $theme-dark={{ color: '$primary' }}
          $theme-light={{ color: '$color12' }}
        />
        <ButtonText
          fontSize="$4"
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
  return (
    <QuickActionButton href={'/earn'}>
      <YStack gap="$2" jc={'space-between'} ai="center" px="$3" py="$3.5">
        <IconStacks
          size={'$1.5'}
          $theme-dark={{ color: '$primary' }}
          $theme-light={{ color: '$color12' }}
        />
        <ButtonText
          fontSize="$4"
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
HomeQuickActions.Invest = Invest
HomeQuickActions.Earn = Earn
