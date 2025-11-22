import { Stack } from 'expo-router/build/layouts/Stack'
import { CONTAINER_OFFSET } from 'apps-expo/components/layout/ScreenContainer'
import FriendsScreen from 'app/features/affiliate/screen'
import { Container, useSafeAreaInsets } from '@my/ui'
import { useTranslation } from 'react-i18next'

export default function ReferralsScreen() {
  const insets = useSafeAreaInsets()
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.account.referrals'),
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
