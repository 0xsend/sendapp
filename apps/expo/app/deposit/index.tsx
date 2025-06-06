import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack as StackRouter } from 'expo-router'
import { Link, Paragraph } from '@my/ui'

export default function DepositScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Deposit',
        }}
      />
      <ScreenContainer>
        <Paragraph>DepositScreen</Paragraph>
        <Link href={'/deposit/crypto'}>crypto</Link>
        <Link href={'/deposit/apple-pay'}>apple pay</Link>
        <Link href={'/deposit/debit-card'}>debit card</Link>
        <Link href={'/deposit/success'}>success deposit</Link>
      </ScreenContainer>
    </>
  )
}
