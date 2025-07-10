import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { ProfilesDetailsModal } from 'app/features/profile/components/ProfileDetailsModal'

export default function AboutScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'About',
        }}
      />
      <ScreenContainer>
        <ProfilesDetailsModal />
      </ScreenContainer>
    </>
  )
}
