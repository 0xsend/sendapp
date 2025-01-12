import {
  XStack,
  Stack,
  styled,
  type XStackProps,
  LinearGradient,
  usePwa,
  Paragraph,
  H3,
  useMedia,
  AnimatePresence,
} from '@my/ui'
import { HomeButtons } from '../features/home/HomeButtons'
import { useScrollDirection } from '../provider/scroll'
import { ProfileButtons } from 'app/features/profile/ProfileButtons'
import { useUser } from 'app/utils/useUser'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useProfileScreenParams, useRewardsScreenParams } from 'app/routers/params'
import { useMonthlyDistributions } from 'app/utils/distributions'
import { DistributionClaimButton } from 'app/features/account/rewards/components/DistributionClaimButton'
import formatAmount from 'app/utils/formatAmount'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useIsSendingUnlocked } from 'app/utils/useIsSendingUnlocked'

const Row = styled(XStack, {
  w: '100%',
  ai: 'center',
  mx: 'auto',
  jc: 'space-around',
  gap: '$4',
  maw: 768,
  $gtLg: {
    pt: '$4',
    display: 'none',
  },
  pointerEvents: 'auto',
})

const MobileButtonRow = ({
  children,
  isLoading,
  isVisible,
}: { children: React.ReactElement; isLoading: boolean; isVisible: boolean } & XStackProps) => {
  const isPwa = usePwa()
  const media = useMedia()

  return (
    <Stack
      w={'100%'}
      pb={isPwa ? '$1' : '$5'}
      px="$4"
      $platform-web={{
        position: 'fixed',
        bottom: 0,
        display: media.gtLg ? 'none' : 'flex',
      }}
      $gtLg={{
        display: 'none',
      }}
      animation="200ms"
      opacity={!isLoading && isVisible ? 1 : 0}
      scale={!isLoading && isVisible ? 1 : 0.95}
      animateOnly={['scale', 'transform', 'opacity']}
      pointerEvents={!isLoading && isVisible ? 'auto' : 'none'}
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
        pointerEvents="none"
      />
      {children}
    </Stack>
  )
}

const Home = ({ children, ...props }: XStackProps) => {
  const { coin: selectedCoin } = useCoinFromTokenParam()
  const { isSendingUnlocked, isLoading } = useIsSendingUnlocked()
  const { direction } = useScrollDirection()
  const isVisible = isSendingUnlocked && Boolean(selectedCoin !== undefined) && direction !== 'down'

  return (
    <>
      {children}
      <MobileButtonRow isLoading={isLoading} isVisible={isVisible}>
        <Row {...props}>
          <AnimatePresence>
            {(() => {
              switch (true) {
                case !isSendingUnlocked || !isVisible:
                  return null
                case selectedCoin !== undefined:
                  return (
                    <Stack f={1} $gtSm={{ w: '50%' }} flexDirection="row-reverse" maw={350}>
                      <HomeButtons.SendButton />
                    </Stack>
                  )
                default:
                  return (
                    <>
                      <Stack f={1} w="50%" flexDirection="row-reverse" maw={350}>
                        <HomeButtons.GhostDepositButton />
                      </Stack>

                      <Stack f={1} w="50%" jc={'center'} maw={350}>
                        <HomeButtons.SendButton />
                      </Stack>
                    </>
                  )
              }
            })()}
          </AnimatePresence>
        </Row>
      </MobileButtonRow>
    </>
  )
}

const Profile = (
  { children, ...props }: XStackProps //@todo another use case for a generated type for our route names
) => {
  const [{ sendid, tag }] = useProfileScreenParams()
  const identifier = tag ?? sendid ?? ''
  const identifierType = tag ? 'tag' : 'sendid'
  const { profile, isLoading } = useUser()
  const { data: otherUserProfile } = useProfileLookup(identifierType, identifier?.toString() || '')
  const { direction } = useScrollDirection()

  const isVisible =
    Boolean(otherUserProfile) &&
    profile?.send_id !== otherUserProfile?.sendid &&
    direction !== 'down'

  return (
    <>
      {children}
      <MobileButtonRow isLoading={isLoading} isVisible={isVisible}>
        <Row {...props}>
          <Stack w={'100%'}>
            <AnimatePresence>
              {isVisible && (
                <ProfileButtons.SendButton
                  identifier={otherUserProfile?.tag ?? otherUserProfile?.sendid ?? ''}
                  idType={otherUserProfile?.tag ? 'tag' : 'sendid'}
                />
              )}
            </AnimatePresence>
          </Stack>
        </Row>
      </MobileButtonRow>
    </>
  )
}

const ActivityRewards = ({ children, ...props }: XStackProps) => {
  const [queryParams] = useRewardsScreenParams()
  const { data: distributions, isLoading } = useMonthlyDistributions()
  const distribution =
    distributions?.find((d) => d.number === queryParams.distribution) ?? distributions?.[0]
  const shareAmount = distribution?.distribution_shares?.[0]?.amount_after_slash
  const { direction } = useScrollDirection()

  const isVisible =
    distribution !== undefined &&
    shareAmount !== undefined &&
    shareAmount > 0 &&
    direction !== 'down'
  const distributionMonth = distribution?.timezone_adjusted_qualification_end.toLocaleString(
    'default',
    {
      month: 'long',
    }
  )

  const now = new Date()
  const isQualificationOver =
    distribution?.qualification_end !== undefined && distribution.qualification_end < now

  return (
    <>
      {children}
      <MobileButtonRow isLoading={isLoading} isVisible={isVisible}>
        <Stack ai="center" jc="space-between" gap="$3" pt="$1" $gtLg={{ display: 'none' }}>
          <H3 fontWeight={'600'} color={'$color10'}>
            {isQualificationOver
              ? `Total ${distributionMonth} Rewards`
              : `Estimated ${distributionMonth} Rewards`}
          </H3>

          <Row {...props} $xs={{ fd: 'column' }}>
            <Paragraph
              fontFamily={'$mono'}
              $gtXs={{ fontSize: '$10' }}
              fontSize={'$9'}
              fontWeight={'500'}
              lh={40}
            >
              {shareAmount === undefined ? '' : `${formatAmount(shareAmount, 10, 0)} SEND`}
            </Paragraph>
            {isVisible && <DistributionClaimButton distribution={distribution} />}
          </Row>
        </Stack>
      </MobileButtonRow>
    </>
  )
}

Home.displayName = 'MobileButtonRowHome'
Profile.displayName = 'MobileButtonRowProfile'
ActivityRewards.displayName = 'MobileButtonRowActivityRewards'

MobileButtonRow.Home = Home
MobileButtonRow.Profile = Profile
MobileButtonRow.ActivityRewards = ActivityRewards

export const MobileButtonRowLayout = {
  Home: Home,
  Profile: Profile,
  ActivityRewards: ActivityRewards,
}
