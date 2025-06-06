import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { Link, Paragraph } from '@my/ui'

export default function SavingsAssetScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Savings',
        }}
      />
      <ScreenContainer>
        <Paragraph>SavingsAssetScreen</Paragraph>
        <Link href={'/earn/usdc'}>crypto</Link>
      </ScreenContainer>
    </>
  )
}
