import { Stack as StackRouter } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function BalanceAssetSavingsScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Savings Balance',
        }}
      />
      <ScreenContainer>
        <Paragraph>BalanceAssetSavingsScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
