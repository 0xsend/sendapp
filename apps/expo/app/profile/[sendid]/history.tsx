import { CONTAINER_OFFSET } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { ProfileHistoryScreen } from 'app/features/profile/history/screen'
import { Container, useSafeAreaInsets } from '@my/ui'
import { useTranslation } from 'react-i18next'

export default function Screen() {
  const insets = useSafeAreaInsets()
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.profile.history'),
        }}
      />
      <Container
        safeAreaProps={{
          edges: ['left', 'right'],
          style: { flex: 1 },
        }}
        flex={1}
        backgroundColor="$background"
        paddingTop={CONTAINER_OFFSET}
        paddingBottom={insets.bottom + CONTAINER_OFFSET}
      >
        <ProfileHistoryScreen />
      </Container>
    </>
  )
}
