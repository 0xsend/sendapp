import {
  Button,
  LinkableButton,
  type LinkableButtonProps,
  Theme,
  XStack,
  YStack,
  type XStackProps,
  Stack,
} from '@my/ui'
import { IconArrowUp, IconChart, IconPlus, IconStacks, IconSwap } from 'app/components/icons'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { sendCoin, usdcCoin } from 'app/data/coins'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { baseMainnet, sendTokenAddress } from '@my/wagmi'

type HomeQuickActionsProps = XStackProps

export const HomeQuickActions = ({ children, ...props }: HomeQuickActionsProps) => {
  return (
    <XStack w={'100%'} gap={'$3'} $gtLg={{ gap: '$5' }} {...props}>
      {children}
    </XStack>
  )
}

const QuickActionButton = ({ href, children, ...props }: LinkableButtonProps) => {
  const hoverStyles = useHoverStyles()
  return (
    <LinkableButton
      href={href}
      position="relative"
      f={1}
      w="100%"
      h="auto"
      p={0}
      aspectRatio={1}
      ai="flex-end"
      jc="space-between"
      hoverStyle={hoverStyles}
      focusStyle={hoverStyles}
      {...props}
    >
      <Stack w="100%" h="100%" overflow={'hidden'} bc="$black" opacity={0.35} position="absolute" />
      <YStack px="$2" testID={'send-quick-action'} f={1} height="100%" py="$5" jc="flex-end">
        {children}
      </YStack>
    </LinkableButton>
  )
}

const Send = () => {
  const getSendUrl = () => {
    return `/send?token=${sendTokenAddress[baseMainnet.id]}`
  }
  return (
    <QuickActionButton href={getSendUrl()} bc="$primary">
      <YStack testID={'send-quick-action'} h="100%" ai="center" jc="center">
        <Button.Icon>
          <IconArrowUp
            my="auto"
            size="$9"
            aspectRatio={1}
            color={'$color12'}
            $theme-light={{ color: '$color0' }}
          />
        </Button.Icon>
        <Button.Text fontSize={'$7'} pl="$2" als="flex-start">
          Send
        </Button.Text>
      </YStack>
    </QuickActionButton>
  )
}

const Invest = () => {
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
    <QuickActionButton href={getTradeUrl()} bc="$decay">
      <YStack testID={'send-quick-action'} h="100%" ai="center" jc="center">
        <Button.Icon>
          <IconChart
            my="auto"
            size="$10"
            aspectRatio={1}
            color={'$color12'}
            $theme-light={{ color: '$color0' }}
          />
        </Button.Icon>
        <Button.Text fontSize={'$7'} pl="$2" als="flex-start">
          Invest
        </Button.Text>
      </YStack>
    </QuickActionButton>
  )
}

const Rewards = () => {
  const getRewardsUrl = () => {
    return '/explore/rewards'
  }
  return (
    <QuickActionButton
      href={getRewardsUrl()}
      backgroundImage={'url(https://ghassets.send.app/app_images/explore_rewards.jpg)'}
      backgroundPosition={'center 15%'}
      backgroundRepeat={'no-repeat'}
      backgroundSize={'cover'}
    >
      <YStack testID={'send-quick-action'} py="$1" $gtSm={{ py: '$1' }} jc="flex-end">
        <Button.Text fontSize={'$7'} pl="$2">
          Rewards
        </Button.Text>
      </YStack>
    </QuickActionButton>
  )
}

const Savings = () => {
  return (
    <QuickActionButton href={'/earn'} bc={'$tokenUsdc'}>
      <YStack testID={'send-quick-action'} h="100%" ai="center" jc="center">
        <Button.Icon>
          <IconStacks
            my="auto"
            size="$9"
            aspectRatio={1}
            color={'$color12'}
            $theme-light={{ color: '$color0' }}
          />
        </Button.Icon>
        <Button.Text fontSize={'$7'} pl="$2" als="flex-start">
          Savings
        </Button.Text>
      </YStack>
    </QuickActionButton>
  )
}

HomeQuickActions.Send = Send
HomeQuickActions.Invest = Invest
HomeQuickActions.Savings = Savings
HomeQuickActions.Rewards = Rewards
