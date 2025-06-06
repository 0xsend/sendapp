import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack as StackRouter } from 'expo-router'
import { Paragraph } from '@my/ui'

export default function RewardsScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Rewards',
        }}
      />
      <ScreenContainer>
        <Paragraph>Rewards</Paragraph>
      </ScreenContainer>
    </>
  )
}
