import { Button, LinkableButton, Theme, XStack, YStack, type XStackProps } from '@my/ui'
import { IconArrowUp, IconPlus, IconSwap } from 'app/components/icons'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { sendCoin, usdcCoin } from 'app/data/coins'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useIsSendingUnlocked } from 'app/utils/useIsSendingUnlocked'

type HomeQuickActionsProps = XStackProps

export const HomeQuickActions = ({ ...props }: HomeQuickActionsProps) => {
  const { coin } = useCoinFromTokenParam()
  const hoverStyles = useHoverStyles()
  const { isSendingUnlocked } = useIsSendingUnlocked()

  const getTradeUrl = () => {
    if (!coin) {
      return '/trade'
    }

    if (coin.symbol === sendCoin.symbol) {
      return `/trade?inToken=${coin.token}&outToken=${usdcCoin.token}`
    }

    return `/trade?inToken=${coin.token}`
  }

  const getSendUrl = () => {
    if (!coin) {
      return '/send'
    }

    return `/send?sendToken=${coin.token}`
  }

  return (
    <XStack w={'100%'} gap={'$3'} $gtLg={{ gap: '$5' }} {...props}>
      <LinkableButton
        href="/deposit"
        f={1}
        height={'auto'}
        hoverStyle={hoverStyles}
        focusStyle={hoverStyles}
        ta="center"
        w="100%"
      >
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
      </LinkableButton>
      {isSendingUnlocked && (
        <LinkableButton
          href={getSendUrl()}
          f={1}
          height={'auto'}
          hoverStyle={hoverStyles}
          focusStyle={hoverStyles}
          ta="center"
          w="100%"
        >
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
        </LinkableButton>
      )}
      <LinkableButton
        href={getTradeUrl()}
        f={1}
        height={'auto'}
        hoverStyle={hoverStyles}
        focusStyle={hoverStyles}
        ta="center"
        w="100%"
      >
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
      </LinkableButton>
    </XStack>
  )
}
