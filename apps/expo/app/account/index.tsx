import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack as StackRouter } from 'expo-router'
import { Link, Paragraph } from '@my/ui'

export default function AccountScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Account',
        }}
      />
      <ScreenContainer>
        <Paragraph>AccountScreen</Paragraph>
        <Link href={'/account/edit-profile'}>profile</Link>
        <Link href={'/account/personal-info'}>personal info</Link>
        <Link href={'/account/affiliate'}>referrals</Link>
        <Link href={'/account/sendtag'}>sendtags</Link>
        <Link href={'/account/backup'}>passkeys</Link>
      </ScreenContainer>
    </>
  )
}
