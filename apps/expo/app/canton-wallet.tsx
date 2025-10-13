import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { CantonWalletScreen } from 'app/features/canton-wallet/screen'

export default function CantonWallet() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Explore Canton Wallet',
        }}
      />
      <ScreenContainer>
        <CantonWalletScreen />
      </ScreenContainer>
    </>
  )
}
