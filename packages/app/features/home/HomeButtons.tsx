import { IconPlus } from 'app/components/icons'
import { useRootScreenParams } from 'app/routers/params'
import { XStack, LinkableButton } from '@my/ui'

export const DepositButton = () => {
  return (
    <LinkableButton
      theme="green"
      px={'$3.5'}
      h={'$4.5'}
      borderRadius={'$4'}
      f={1}
      testID="homeDepositButton"
      href="/deposit"
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

export const GhostDepositButton = () => {
  return (
    <LinkableButton
      theme="green"
      px={'$3.5'}
      h={'$4.5'}
      borderRadius={'$4'}
      f={1}
      testID="homeDepositButton"
      bw={1}
      bc={'$backgroundTransparent'}
      $theme-light={{ boc: '$color12' }}
      $theme-dark={{ boc: '$primary' }}
      key="home-ghost-deposit-button"
      animation="200ms"
      enterStyle={{
        opacity: 0,
      }}
      exitStyle={{
        opacity: 0,
      }}
      href="/deposit"
    >
      <XStack w={'100%'} gap={'$2.5'} ai={'center'} jc="center">
        <XStack alignItems={'center'} justifyContent={'center'} zIndex={2}>
          <IconPlus
            size={'$1.5'}
            $theme-dark={{ color: '$primary' }}
            $theme-light={{ color: '$color12' }}
          />
        </XStack>
        <LinkableButton.Text fontWeight={'400'} col={'$color12'} tt="uppercase" size={'$5'}>
          Deposit
        </LinkableButton.Text>
      </XStack>
    </LinkableButton>
  )
}

export const SendButton = () => {
  const [{ token }] = useRootScreenParams()
  const href = token ? `/send?sendToken=${token}` : '/send'
  return (
    <XStack testID="homeSendButton" f={1}>
      <LinkableButton
        theme={'green'}
        br="$4"
        px={'$3.5'}
        h={'$4.5'}
        w="100%"
        key="home-send-button"
        animation="200ms"
        enterStyle={{
          opacity: 0,
        }}
        exitStyle={{
          opacity: 0,
        }}
        href={href}
      >
        <XStack w={'100%'} ai={'center'} jc="center" h="100%">
          <LinkableButton.Text
            fontWeight={'400'}
            $theme-dark={{ col: '$color0' }}
            tt="uppercase"
            size={'$5'}
          >
            Send
          </LinkableButton.Text>
        </XStack>
      </LinkableButton>
    </XStack>
  )
}

export const HomeButtons = {
  DepositButton: DepositButton,
  SendButton: SendButton,
  GhostDepositButton: GhostDepositButton,
}
