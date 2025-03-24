import { IconPlus, IconGame } from 'app/components/icons'
import { XStack, LinkableButton, type LinkableButtonProps } from '@my/ui'

export const DepositButton = (props: Omit<LinkableButtonProps, 'href' | 'children'>) => {
  return (
    <LinkableButton
      theme="green"
      href="/deposit"
      px={'$3.5'}
      h={'$4.5'}
      borderRadius={'$4'}
      f={1}
      testID="playDepositButton"
      {...props}
    >
      <XStack w={'100%'} gap={'$2.5'} ai={'center'} jc="center">
        <XStack alignItems={'center'} justifyContent={'center'} zIndex={2}>
          <IconPlus size={'$1.5'} $theme-dark={{ color: '$color0' }} />
        </XStack>
        <LinkableButton.Text fontWeight={'500'} tt={'uppercase'} $theme-dark={{ col: '$color0' }}>
          Deposit
        </LinkableButton.Text>
      </XStack>
    </LinkableButton>
  )
}

export const BuyTicketsButton = (props: Omit<LinkableButtonProps, 'children'>) => {
  return (
    <LinkableButton
      theme={'green'}
      br="$4"
      px={'$3.5'}
      h={'$4.5'}
      w="100%"
      key="play-buy-tickets-button"
      animation="200ms"
      enterStyle={{
        opacity: 0,
      }}
      exitStyle={{
        opacity: 0,
      }}
      {...props}
      href="/play/buy-tickets" // Navigate to the buy tickets screen (after props to avoid overwrite warning)
    >
      <XStack w={'100%'} ai={'center'} jc="center" h="100%" gap="$2">
        <IconGame size={'$1.5'} $theme-dark={{ color: '$color0' }} />
        <LinkableButton.Text
          fontWeight={'400'}
          $theme-dark={{ col: '$color0' }}
          tt="uppercase"
          size={'$5'}
        >
          Buy Tickets
        </LinkableButton.Text>
      </XStack>
    </LinkableButton>
  )
}

export const PlayButtons = {
  DepositButton: DepositButton,
  BuyTicketsButton: BuyTicketsButton,
}
