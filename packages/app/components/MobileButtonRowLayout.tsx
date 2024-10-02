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
import { ProfileButtons } from 'app/features/profile/ProfileButtons'
import { useUser } from 'app/utils/useUser'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useProfileScreenParams } from 'app/routers/params'

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

  const isLoading = isLoadingSendAccount || isLoadingBalances

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

export const Profile = (
  { children, ...props }: XStackProps //@todo another use case for a generated type for our route names
) => {
  const isPwa = usePwa()
  const [{ sendid, tag }] = useProfileScreenParams()
  const identifier = tag ?? sendid ?? ''
  const identifierType = tag ? 'tag' : 'sendid'
  const { profile, isLoading } = useUser()
  const { data: otherUserProfile } = useProfileLookup(identifierType, identifier?.toString() || '')

  const { direction } = useScrollDirection()

  const isVisible = Boolean(otherUserProfile) && profile?.send_id !== otherUserProfile?.sendid

  return (
    <>
      {children}
      <AnimatePresence>
        {!isLoading && isVisible && direction !== 'down' && (
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
              <Stack w={200}>
                <ProfileButtons.SendButton
                  identifier={otherUserProfile?.tag ?? otherUserProfile?.sendid ?? ''}
                  idType="tag"
                />
              </Stack>
            </Row>
          </Stack>
        )}
      </AnimatePresence>
    </>
  )
}

export const MobileButtonRowLayout = {
  Home: Home,
  Profile: Profile,
}
