import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { DepositCryptoScreen } from 'app/features/deposit/crypto/screen'

export default function CryptoDepositScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Deposit on Base',
        }}
      />
      <ScreenContainer>
        <DepositCryptoScreen />
      </ScreenContainer>
    </>
  )
}
