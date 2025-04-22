import { Anchor, Container, ScrollView, YStack } from '@my/ui'
import { useLink } from 'solito/link'
import { IconSendLogo } from 'app/components/icons'
import { SignUpScreen } from 'app/features/auth/sign-up/screen'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Sign Up',
        }}
      />

      <Container
        safeAreaProps={{
          edges: ['top', 'bottom', 'left', 'right'],
          style: {
            flex: 1,
          },
        }}
        flex={1}
      >
        <YStack ai="center" f={1} position="relative">
          <Anchor {...useLink({ href: '/' })} mx="auto" position="absolute" top={'$4'}>
            <IconSendLogo size={'$4'} color={'$color12'} />
          </Anchor>
          <ScrollView pt="$2" mt="$14" f={1}>
            <SignUpScreen />
          </ScrollView>
        </YStack>
      </Container>
    </>
  )
}
