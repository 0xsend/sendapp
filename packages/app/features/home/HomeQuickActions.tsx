import { Button, LinkableButton, Theme, XStack, YStack, type XStackProps } from '@my/ui'
import { IconPlus, IconSwap } from 'app/components/icons'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { sendCoin, usdcCoin } from 'app/data/coins'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'

export const HomeQuickActions = (props: XStackProps) => {
  const { coin } = useCoinFromTokenParam()
  const hoverStyles = useHoverStyles()

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
    <XStack w={'100%'} gap={'$3.5'} $gtLg={{ gap: '$5' }} {...props}>
      <LinkableButton
        href="/deposit"
        f={1}
        height={'auto'}
        hoverStyle={hoverStyles}
        focusStyle={hoverStyles}
      >
        <YStack gap="$2" jc={'space-between'} ai="center" p="$4">
          <IconPlus
            size={'$1.5'}
            $theme-dark={{ color: '$primary' }}
            $theme-light={{ color: '$color12' }}
          />
          <Button.Text fontSize={'$4'} px="$2">
            Deposit
          </Button.Text>
        </YStack>
      </LinkableButton>
      <LinkableButton
        href={getTradeUrl()}
        f={1}
        height={'auto'}
        hoverStyle={hoverStyles}
        focusStyle={hoverStyles}
      >
        <YStack gap="$2" jc={'space-between'} ai="center" p="$4" height={'auto'}>
          <Theme name="green">
            <IconSwap
              size={'$1'}
              $theme-dark={{ color: '$primary' }}
              $theme-light={{ color: '$color12' }}
            />
          </Theme>
          <Button.Text fontSize={'$4'} px="$2">
            Trade
          </Button.Text>
        </YStack>
      </LinkableButton>
    </XStack>
  )
}
