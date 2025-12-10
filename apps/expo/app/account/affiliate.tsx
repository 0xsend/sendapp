import { Stack } from 'expo-router/build/layouts/Stack'
import { CONTAINER_OFFSET } from 'apps-expo/components/layout/ScreenContainer'
import FriendsScreen from 'app/features/affiliate/screen'
import { Container, useSafeAreaInsets } from '@my/ui'
import { useTranslation } from 'react-i18next'
import { useFriends } from 'app/features/affiliate/utils/useFriends'
import { useReferrer } from 'app/utils/useReferrer'

export default function ReferralsScreen() {
  const insets = useSafeAreaInsets()
  const { t } = useTranslation('navigation')

  // Fetch referral data
  const { data: friendsData, isLoading: isFriendsLoading } = useFriends(3)
  const { data: referrer, isLoading: isReferrerLoading } = useReferrer()

  // Calculate total count (friends referred by user + 1 if user was referred)
  const totalCount = (friendsData?.count ?? 0) + (referrer ? 1 : 0)

  // Determine if still loading
  const isLoading = isFriendsLoading || isReferrerLoading

  // Build dynamic title
  const title = isLoading
    ? t('stack.account.referrals')
    : `${t('stack.account.referrals')} (${totalCount})`

  return (
    <>
      <Stack.Screen
        options={{
          title: title,
        }}
      />
      <Container
        safeAreaProps={{
          edges: ['left', 'right'],
          style: { flex: 1 },
        }}
        flex={1}
        backgroundColor="$background"
        overflow={'visible'}
        paddingTop={CONTAINER_OFFSET}
        paddingBottom={CONTAINER_OFFSET + insets.bottom}
      >
        <FriendsScreen />
      </Container>
    </>
  )
}
