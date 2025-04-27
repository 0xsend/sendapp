import { Container, Stack, type StackProps, YStack } from '@my/ui'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'

export function ProfileLayout({
  children,
  TopNav,
  fullHeight,
  ...props
}: {
  children: React.ReactNode
  TopNav?: React.ReactNode
} & StackProps & { fullHeight?: boolean }) {
  return (
    <HomeSideBarWrapper>
      <Stack height={fullHeight ? '100%' : 'auto'} f={1} {...props}>
        <YStack gap="$3" $gtLg={{ pt: 80 }} w={'100%'}>
          {TopNav}
        </YStack>
        <Container
          safeAreaProps={{
            style: { flex: 1 },
            edges: {
              top: 'off',
              bottom: 'maximum',
              left: 'additive',
              right: 'additive',
            },
          }}
          $gtLg={{ pt: '$5', pb: '$0' }}
          height={fullHeight ? '100%' : 'auto'}
        >
          {children}
        </Container>
      </Stack>
    </HomeSideBarWrapper>
  )
}
