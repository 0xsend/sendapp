import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack as StackRouter } from 'expo-router'
import { Link, Paragraph } from '@my/ui'

export default function SavingsScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Savings',
        }}
      />
      <ScreenContainer>
        <Paragraph>SavingsScreen</Paragraph>
        <Link href={'/earn/usdc/balance'}>balance</Link>
        <Link href={'/earn/usdc/deposit'}>deposit</Link>
        <Link href={'/earn/usdc/withdraw'}>withdraw</Link>
      </ScreenContainer>
    </>
  )
}
