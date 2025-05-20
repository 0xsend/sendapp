import { SecretShopScreen } from 'app/features/secret-shop/screen'
import { ScreenContentContainer } from 'app/components/ScreenContentContainer'
import { Stack } from 'expo-router'

export default function SecretShopScreenWrapper() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Secret Shop',
          headerBackTitle: 'Back',
          headerShown: true,
        }}
      />
      <ScreenContentContainer>
        <SecretShopScreen />
      </ScreenContentContainer>
    </>
  )
}
