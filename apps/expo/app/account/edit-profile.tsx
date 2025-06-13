import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { EditProfile } from 'app/features/account/components/editProfile/screen'

export default function ProfileScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Profile',
        }}
      />
      <ScreenContainer>
        <EditProfile />
      </ScreenContainer>
    </>
  )
}
