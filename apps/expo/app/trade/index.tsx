import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { Link, Paragraph } from '@my/ui'

export default function TradeScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Trade',
        }}
      />
      <ScreenContainer>
        <Paragraph>TradeScreen</Paragraph>
        <Link href={'/trade/summary'}>summary</Link>
      </ScreenContainer>
    </>
  )
}
