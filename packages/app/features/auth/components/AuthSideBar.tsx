import { SideBar, Stack, Theme, YStack, useMedia, type YStackProps, XStack } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { OnboardingForm } from 'app/features/auth/onboarding/onboarding-form'
import { usePathname } from 'app/utils/usePathname'
import { SignInScreen } from '../sign-in/screen'

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
          <SignInScreen />
        ) : pathName.includes('auth/onboarding') ? (
          <OnboardingForm />
        ) : null}
      </YStack>
    </SideBar>
  )
}

export const AuthSideBarWrapper = ({ children }: { children?: React.ReactNode }) => {
  const media = useMedia()
  return (
    <XStack overflow="hidden" height={'100%'}>
      {media.gtMd && <AuthSideBar h={'92%'} ml={'$7'} my={'auto'} br={'$8'} />}
      {children}
    </XStack>
  )
}
