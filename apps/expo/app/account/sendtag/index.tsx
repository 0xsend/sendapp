import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack as StackRouter } from 'expo-router'
import { Link, Paragraph } from '@my/ui'

export default function SendtagsScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Sendtags',
        }}
      />
      <ScreenContainer>
        <Paragraph>Sendtags screen</Paragraph>
        <Link href={'/account/sendtag/add'}>add</Link>
        <Link href={'/account/sendtag/checkout'}>checkout</Link>
        <Link href={'/account/sendtag/first'}>first</Link>
      </ScreenContainer>
    </>
  )
}
