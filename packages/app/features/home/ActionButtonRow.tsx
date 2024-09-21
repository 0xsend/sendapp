import { IconArrowRight, IconDeposit } from 'app/components/icons'
import { useRootScreenParams } from 'app/routers/params'
import { XStack, LinkableButton, Stack, styled, type XStackProps } from '@my/ui'

const Row = styled(XStack, {
  w: '100%',
  ai: 'center',
  mx: 'auto',
  pt: '$4',
  jc: 'space-around',
  gap: '$4',
  maw: 768,
})

export const ActionButtonRow = (props: XStackProps) => {
  return (
    <Row {...props}>
      <Stack f={1} w="50%" flexDirection="row-reverse">
        <DepositButton />
      </Stack>
      <Stack f={1} w="50%" jc={'center'}>
        <SendButton />
      </Stack>
    </Row>
  )
}

export const DepositButton = () => {
  return (
    <LinkableButton theme="green" href="/deposit" px={'$3.5'} h={'$4.5'} borderRadius={'$4'} f={1}>
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

export const SendButton = () => {
  const [{ token }] = useRootScreenParams()
  const href = token ? `/send?sendToken=${token}` : '/send'
  return (
    <LinkableButton
      href={href}
      theme="green"
      br="$4"
      px={'$3.5'}
      h={'$4.5'}
      w="100%"
      testID="homeSendButton"
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
