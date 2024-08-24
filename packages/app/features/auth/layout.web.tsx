import { Anchor, Container, YStack, usePwa } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { useLink } from 'solito/link'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const isPwa = usePwa()

  return (
    <Container height={'100%'} safeAreaPadding={isPwa && 'y'}>
      <YStack ai="center" f={1} pt="$7">
        <Anchor {...useLink({ href: '/' })} mx="auto" position="absolute" top={'$6'}>
          <IconSendLogo size={'$6'} color={'$color12'} />
        </Anchor>
        <YStack pt="$14" mt="$10">
          {children}
        </YStack>
      </YStack>
    </Container>
  )
}
