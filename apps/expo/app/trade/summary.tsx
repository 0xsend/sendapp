import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function TradeSummaryScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Trade summary',
        }}
      />
      <ScreenContainer>
        <Paragraph>TradeSummaryScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
