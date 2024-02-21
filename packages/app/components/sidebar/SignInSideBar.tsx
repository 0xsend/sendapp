import { SideBar, SideBarWrapper, Stack, Theme, YStack, YStackProps, useMedia } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { SignInForm } from 'app/features/auth/sign-in-form'

const SignInSideBar = ({ ...props }: YStackProps) => (
  <SideBar px="$7" {...props}>
    <Stack als={'flex-start'} pt="$2.5" pl="$3">
      <Theme inverse={true}>
        <IconSendLogo size={'$3'} color="$background" />
      </Theme>
    </Stack>
    <YStack f={1} gap="$4" ai="center" jc="center">
      <SignInForm />
    </YStack>
  </SideBar>
)

export const SignInSideBarWrapper = ({ children }: { children?: React.ReactNode }) => {
  const media = useMedia()
  if (media.gtMd) {
    return (
      <SideBarWrapper sidebar={<SignInSideBar bc={'$background'} />}>{children}</SideBarWrapper>
    )
  }
  return children
}
