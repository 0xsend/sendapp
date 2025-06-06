import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack as StackRouter } from 'expo-router'
import { Link, Paragraph } from '@my/ui'

export default function AccountScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Passkeys',
        }}
      />
      <ScreenContainer>
        <Paragraph>AccountScreen</Paragraph>
        <Link href={'/account/backup/create'}>create</Link>
        <Link href={'/account/backup/confirm/1'}>confirm</Link>
      </ScreenContainer>
    </>
  )
}
