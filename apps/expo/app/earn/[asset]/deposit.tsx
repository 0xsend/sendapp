import { Stack as StackRouter } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function DepositAssetSavingsScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Start Saving',
        }}
      />
      <ScreenContainer>
        <Paragraph>DepositAssetSavingsScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
