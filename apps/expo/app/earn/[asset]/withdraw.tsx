import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function WithdrawAssetSavingsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Withdraw Savings',
        }}
      />
      <ScreenContainer>
        <Paragraph>WithdrawAssetSavingsScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
