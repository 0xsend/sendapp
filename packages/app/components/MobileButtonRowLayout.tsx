import {
  XStack,
  Stack,
  styled,
  type XStackProps,
  LinearGradient,
  Paragraph,
  H3,
  AnimatePresence,
  useSafeAreaInsets,
  Container,
} from '@my/ui'
import { HomeButtons } from '../features/home/HomeButtons'
import { useScrollDirection } from '../provider/scroll'
import { ProfileButtons } from 'app/features/profile/ProfileButtons'
import { useUser } from 'app/utils/useUser'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useProfileScreenParams, useRewardsScreenParams } from 'app/routers/params'
import { useMonthlyDistributions } from 'app/utils/distributions'
import { DistributionClaimButton } from 'app/features/explore/rewards/components/DistributionClaimButton'
import formatAmount from 'app/utils/formatAmount'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useIsSendingUnlocked } from 'app/utils/useIsSendingUnlocked'
import { formatUnits } from 'viem'
import { sendCoin } from 'app/data/coins'
import { BOTTOM_NAV_BAR_HEIGHT } from 'app/components/BottomTabBar/BottomNavBar'

const Row = styled(XStack, {
  w: '100%',
  ai: 'center',
  mx: 'auto',
  jc: 'space-around',
  gap: '$4',
  maw: 768,
  $gtLg: {
    display: 'none',
  },
  pointerEvents: 'auto',
})

const MobileButtonRow = ({
  children,
  isLoading,
  isVisible,
}: { children: React.ReactElement; isLoading: boolean; isVisible: boolean } & XStackProps) => {
  const { bottom } = useSafeAreaInsets()

  return (
    <Stack
      w={'100%'}
      px="$4"
      pb={Math.max(bottom, 24)}
      $platform-web={{
        position: 'fixed',
        bottom: 0,
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
  const isVisible = !isLoading && isSendingUnlocked && direction !== 'down' && selectedCoin

  return (
    <>
      {children}
      {isVisible && (
        <Container>
          <XStack
            $platform-web={{
              position: 'fixed',
            }}
            bottom={BOTTOM_NAV_BAR_HEIGHT}
            left={0}
            right={0}
            zIndex={100}
            jc={'center'}
            px={'$3.5'}
            $gtLg={{ display: 'none' }}
            {...props}
          >
            <XStack w={'100%'} $gtSm={{ maxWidth: 736 }} $gtMd={{ maxWidth: 896 }}>
              <HomeButtons.SendButton />
            </XStack>
          </XStack>
        </Container>
      )}
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
  const shareAmount = BigInt(distribution?.distribution_shares?.[0]?.amount || 0)
  const { direction } = useScrollDirection()

  const isClaimable = distribution !== undefined && shareAmount !== undefined && shareAmount > 0n
  const isVisible = isClaimable && direction !== 'down'

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
            {isQualificationOver ? `${distributionMonth} Rewards` : `${distributionMonth} Rewards`}
          </H3>

          <Row {...props} $xs={{ fd: 'column' }}>
            <Paragraph
              fontFamily={'$mono'}
              $gtXs={{ fontSize: '$10' }}
              fontSize={'$9'}
              fontWeight={'500'}
              lh={40}
            >
              {shareAmount === undefined
                ? ''
                : `${formatAmount(
                    formatUnits(shareAmount ?? 0n, distribution?.token_decimals ?? 18) ?? 0n,
                    10,
                    sendCoin.formatDecimals
                  )} SEND`}
            </Paragraph>
            {isClaimable && <DistributionClaimButton distribution={distribution} />}
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
