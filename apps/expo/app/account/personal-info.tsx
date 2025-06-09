import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { PersonalInfoScreen } from 'app/features/account/components/personalInfo/screen'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Personal information',
        }}
      />
      <ScreenContainer>
        <PersonalInfoScreen />
      </ScreenContainer>
    </>
  )
}
