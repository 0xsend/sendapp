import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { ProfilesDetailsModal } from 'app/features/profile/components/ProfileDetailsModal'
import { useTranslation } from 'react-i18next'

export default function AboutScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.profile.about'),
        }}
      />
      <ScreenContainer>
        <ProfilesDetailsModal />
      </ScreenContainer>
    </>
  )
}
