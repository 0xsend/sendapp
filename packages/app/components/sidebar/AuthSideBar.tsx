import { SideBar, SideBarWrapper, Stack, Theme, YStack, type YStackProps } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { SignInForm } from 'app/features/auth/sign-in/sign-in-form'
import { OnboardingForm } from 'app/features/auth/onboarding/onboarding-form'
import { usePathname } from 'app/utils/usePathname'

const AuthSideBar = ({ ...props }: YStackProps) => {
  const pathName = usePathname()

  return (
    <SideBar px="$7" {...props}>
      <Stack als={'flex-start'}>
        <Theme inverse={true}>
          <IconSendLogo size={'$3'} color="$background" />
        </Theme>
      </Stack>
      <YStack f={1} gap="$4" ai="center" jc="center">
        {pathName.includes('/auth/sign-in') ? (
          <SignInForm />
        ) : pathName.includes('auth/onboarding') ? (
          <OnboardingForm />
        ) : null}
      </YStack>
    </SideBar>
  )
}

export const AuthSideBarWrapper = ({ children }: { children?: React.ReactNode }) => (
  <SideBarWrapper
    overflow="hidden"
    sidebar={<AuthSideBar bc={'$background'} h={'92%'} ml={'$7'} my={'auto'} br={'$8'} />}
  >
    {children}
  </SideBarWrapper>
)
