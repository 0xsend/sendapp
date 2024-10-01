import {
  XStack,
  Stack,
  styled,
  type XStackProps,
  AnimatePresence,
  LinearGradient,
  usePwa,
} from '@my/ui'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { parseUnits } from 'viem'
import { coinsDict } from 'app/data/coins'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { HomeButtons } from '../features/home/HomeButtons'
import { useScrollDirection } from '../provider/scroll'

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

export const Home = ({ children, ...props }: XStackProps) => {
  const isPwa = usePwa()
  const { isLoading: isLoadingSendAccount } = useSendAccount()
  const { balances, isLoading: isLoadingBalances } = useSendAccountBalances()
  const usdcBalance = balances?.USDC
  const canSend =
    usdcBalance !== undefined &&
    usdcBalance >= parseUnits('.20', coinsDict[usdcAddress[baseMainnet.id]].decimals)

  const { direction } = useScrollDirection()

  const isLoading = !isLoadingSendAccount || isLoadingBalances

  return (
    <>
      {children}
      <AnimatePresence>
        {!isLoading && direction !== 'down' && (
          <Stack
            w={'100%'}
            pb={isPwa ? '$1' : '$5'}
            px="$4"
            $platform-web={{
              position: 'fixed',
              bottom: 0,
            }}
            $gtLg={{
              display: 'none',
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
                <HomeButtons.DepositButton />
              </Stack>
              {canSend && (
                <Stack f={1} w="50%" jc={'center'} maw={350}>
                  <HomeButtons.SendButton />
                </Stack>
              )}
            </Row>
          </Stack>
        )}
      </AnimatePresence>
    </>
  )
}
