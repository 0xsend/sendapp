import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { MobileAccountLayout } from 'app/features/account/AccountScreenLayout'

export default function AccountScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Account',
        }}
      />
      <ScreenContainer>
        <MobileAccountLayout />
      </ScreenContainer>
    </>
  )
}
