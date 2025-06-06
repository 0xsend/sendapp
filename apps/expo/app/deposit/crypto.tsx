import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function CryptoDepositScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Deposit on Base',
        }}
      />
      <ScreenContainer>
        <Paragraph>CryptoDepositScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
