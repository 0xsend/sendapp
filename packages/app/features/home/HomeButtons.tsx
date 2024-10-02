import { IconArrowRight, IconDeposit } from 'app/components/icons'
import { useRootScreenParams } from 'app/routers/params'
import { XStack, LinkableButton, type LinkableButtonProps } from '@my/ui'

export const DepositButton = () => {
  return (
    <LinkableButton
      theme="green"
      href="/deposit"
      px={'$3.5'}
      h={'$4.5'}
      borderRadius={'$4'}
      f={1}
      testID="homeDepositButton"
    >
      <XStack w={'100%'} jc={'space-between'} ai={'center'}>
        <LinkableButton.Text
          fontWeight={'500'}
          textTransform={'uppercase'}
          $theme-dark={{ col: '$color0' }}
        >
          Deposit
        </LinkableButton.Text>
        <XStack alignItems={'center'} justifyContent={'center'} zIndex={2}>
          <IconDeposit size={'$2.5'} $theme-dark={{ color: '$color0' }} />
        </XStack>
      </XStack>
    </LinkableButton>
  )
}
//@todo this patch should be fixed in LinkableButtonProps
export const SendButton = (props: Omit<LinkableButtonProps, 'href' | 'children'>) => {
  const [{ token }] = useRootScreenParams()
  const href = token ? `/send?sendToken=${token}` : '/send'
  return (
    <LinkableButton
      href={href}
      theme={'green'}
      br="$4"
      px={'$3.5'}
      h={'$4.5'}
      w="100%"
      testID="homeSendButton"
      {...props}
    >
      <XStack w={'100%'} jc={'space-between'} ai={'center'} h="100%">
        <LinkableButton.Text
          fontWeight={'500'}
          textTransform={'uppercase'}
          $theme-dark={{ col: '$color0' }}
        >
          Send
        </LinkableButton.Text>
        <LinkableButton.Icon>
          <IconArrowRight size={'$2.5'} $theme-dark={{ col: '$color0' }} />
        </LinkableButton.Icon>
      </XStack>
    </LinkableButton>
  )
}

export const HomeButtons = {
  DepositButton: DepositButton,
  SendButton: SendButton,
}
