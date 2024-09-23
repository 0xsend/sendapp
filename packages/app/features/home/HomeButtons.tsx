import { IconArrowRight, IconDeposit } from 'app/components/icons'
import { useRootScreenParams } from 'app/routers/params'
import { parseUnits } from 'viem'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { coinsDict } from 'app/data/coins'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import {
  XStack,
  LinkableButton,
  Stack,
  styled,
  type XStackProps,
  AnimatePresence,
  LinearGradient,
  usePwa,
  useMedia,
  type LinkableButtonProps,
} from '@my/ui'

const Row = styled(XStack, {
  w: '100%',
  ai: 'center',
  mx: 'auto',
  jc: 'space-around',
  gap: '$4',
  maw: 768,
  $gtLg: {
    pt: '$4',
  },
})

export const HomeButtonRow = ({
  isVisible = true,
  ...props
}: XStackProps & { isVisible?: boolean }) => {
  const isPwa = usePwa()
  const media = useMedia()
  const { balances, isLoading: balancesIsLoading } = useSendAccountBalances()
  const usdcBalance = balances?.USDC
  const canSend =
    usdcBalance !== undefined &&
    usdcBalance >= parseUnits('.20', coinsDict[usdcAddress[baseMainnet.id]].decimals)

  return (
    <AnimatePresence>
      {!balancesIsLoading && isVisible && (
        <Stack
          w={'100%'}
          pb={isPwa ? '$1' : '$5'}
          px="$4"
          $platform-web={{
            position: media.lg ? 'fixed' : 'relative',
            bottom: 0,
          }}
          $gtLg={{
            position: 'relative',
            pb: '$0',
            px: '$0',
          }}
          animation="200ms"
          opacity={1}
          animateOnly={['scale', 'transform', 'opacity']}
          enterStyle={{ opacity: 0, scale: 0.9 }}
          exitStyle={{ opacity: 0, scale: 0.95 }}
        >
          <LinearGradient
            h={'150%'}
            top={'-50%'}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            locations={[0, 0.33]}
            fullscreen
            colors={['transparent', '$background']}
            $gtLg={{ display: 'none' }}
          />
          <Row {...props}>
            <Stack f={1} w="50%" flexDirection="row-reverse" maw={350}>
              <DepositButton />
            </Stack>
            {canSend && (
              <Stack f={1} w="50%" jc={'center'} maw={350}>
                <SendButton />
              </Stack>
            )}
          </Row>
        </Stack>
      )}
    </AnimatePresence>
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
