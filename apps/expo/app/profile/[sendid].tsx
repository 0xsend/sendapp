import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { Paragraph } from '@my/ui'

export default function ProfileScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'History',
        }}
      />
      <ScreenContainer>
        <Paragraph>History</Paragraph>
      </ScreenContainer>
    </>
  )
}
