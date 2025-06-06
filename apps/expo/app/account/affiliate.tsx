import { Stack as StackRouter } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function ReferralsScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Referrals',
        }}
      />
      <ScreenContainer>
        <Paragraph>referrals screen</Paragraph>
      </ScreenContainer>
    </>
  )
}
