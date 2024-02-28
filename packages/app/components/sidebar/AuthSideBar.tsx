import { SideBar, SideBarWrapper, Stack, Theme, YStack, YStackProps, useMedia } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { SignInForm } from 'app/features/auth/sign-in/sign-in-form'
import { OnboardingForm } from 'app/features/auth/onboarding/onboarding-form'
import { usePathname } from 'app/utils/usePathname'
import { useSendAccounts } from 'app/utils/send-accounts'
import { SendAccountCongratulations } from 'app/features/auth/onboarding/screen'

const AuthSideBar = ({ ...props }: YStackProps) => {
  const pathName = usePathname()
  // @todo handle loading and error states
  const {
    data: sendAccts,
    // error: sendAcctsError,
    // isLoading: sendAcctsIsLoading,
  } = useSendAccounts()

  return (
    <SideBar px="$7" {...props}>
      <Stack als={'flex-start'} pl="$3">
        <Theme inverse={true}>
          <IconSendLogo size={'$3'} color="$background" />
        </Theme>
      </Stack>
      <YStack f={1} gap="$4" ai="center" jc="center">
        {pathName.includes('/auth/sign-in') ? (
          <SignInForm />
        ) : pathName.includes('auth/onboarding') && sendAccts?.length === 0 ? (
          <OnboardingForm />
        ) : (
          <SendAccountCongratulations />
        )}
      </YStack>
    </SideBar>
  )
}

export const AuthSideBarWrapper = ({ children }: { children?: React.ReactNode }) => {
  const media = useMedia()
  if (media.gtMd) {
    return <SideBarWrapper sidebar={<AuthSideBar bc={'$background'} />}>{children}</SideBarWrapper>
  }
  return children
}
