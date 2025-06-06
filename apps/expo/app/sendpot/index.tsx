import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack as StackRouter } from 'expo-router'
import { Link, Paragraph } from '@my/ui'

export default function SendpotScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Sendpot',
        }}
      />
      <ScreenContainer>
        <Paragraph>SendpotScreen</Paragraph>
        <Link href={'/sendpot/buy-tickets'}>but tickets</Link>
        <Link href={'/sendpot/confirm-buy-tickets'}>confirm</Link>
      </ScreenContainer>
    </>
  )
}
