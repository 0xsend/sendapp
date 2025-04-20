import {
  Button,
  LinkableButton,
  type LinkableButtonProps,
  Theme,
  XStack,
  YStack,
  type XStackProps,
} from '@my/ui'
import { IconArrowUp, IconPlus, IconStacks, IconSwap } from 'app/components/icons'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { sendCoin, usdcCoin } from 'app/data/coins'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'

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
      href={href}
      f={1}
      height={'auto'}
      // @ts-expect-error - background type is confused here
      hoverStyle={hoverStyles}
      // @ts-expect-error - background type is confused here
      focusStyle={hoverStyles}
      w="100%"
    >
      {children}
    </LinkableButton>
  )
}

const Send = () => {
  const { coin } = useCoinFromTokenParam()
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
        px="$4"
        py="$3.5"
        $gtSm={{ py: '$4' }}
      >
        <IconArrowUp
          size={'$1.5'}
          $theme-dark={{ color: '$primary' }}
          $theme-light={{ color: '$color12' }}
        />
        <Button.Text fontSize={'$5'} px="$2" ta="center" w="100%">
          Send
        </Button.Text>
      </YStack>
    </QuickActionButton>
  )
}

const Trade = () => {
  const { coin } = useCoinFromTokenParam()
  const getTradeUrl = () => {
    if (!coin) {
      return '/trade'
    }

    if (coin.symbol === sendCoin.symbol) {
      return `/trade?inToken=${coin.token}&outToken=${usdcCoin.token}`
    }

    return `/trade?inToken=${coin.token}`
  }
  return (
    <QuickActionButton href={getTradeUrl()}>
      <YStack gap="$2" jc={'space-between'} ai="center" p="$4" height={'auto'}>
        <Theme name="green">
          <IconSwap
            size={'$1'}
            $theme-dark={{ color: '$primary' }}
            $theme-light={{ color: '$color12' }}
          />
        </Theme>
        <Button.Text fontSize={'$5'} px="$2">
          Trade
        </Button.Text>
      </YStack>
    </QuickActionButton>
  )
}

const Deposit = () => {
  return (
    <QuickActionButton href={'/deposit'}>
      <YStack gap="$2" jc={'space-between'} ai="center" px="$4" py="$3.5" $gtSm={{ py: '$4' }}>
        <IconPlus
          size={'$1.5'}
          $theme-dark={{ color: '$primary' }}
          $theme-light={{ color: '$color12' }}
        />
        <Button.Text fontSize={'$5'} px="$2">
          Deposit
        </Button.Text>
      </YStack>
    </QuickActionButton>
  )
}

const Earn = () => {
  return (
    <QuickActionButton href={'/earn'}>
      <YStack gap="$2" jc={'space-between'} ai="center" px="$4" py="$3.5" $gtSm={{ py: '$4' }}>
        <IconStacks
          size={'$1.5'}
          $theme-dark={{ color: '$primary' }}
          $theme-light={{ color: '$color12' }}
        />
        <Button.Text fontSize={'$5'} px="$2">
          Earn
        </Button.Text>
      </YStack>
    </QuickActionButton>
  )
}

HomeQuickActions.Deposit = Deposit
HomeQuickActions.Send = Send
HomeQuickActions.Trade = Trade
HomeQuickActions.Earn = Earn
