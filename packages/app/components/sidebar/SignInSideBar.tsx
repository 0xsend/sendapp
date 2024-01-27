import {
  Paragraph,
  SideBar,
  SideBarWrapper,
  Stack,
  XStack,
  YStack,
  YStackProps,
  useMedia,
} from '@my/ui'
import { IconSendLogo, IconTelegramLogo, IconXLogo } from 'app/components/icons'
import { SideBarFooterLink } from 'app/components/sidebar/SideBarFooterLink'
import { telegram as telegramSocial, twitter as twitterSocial } from 'app/data/socialLinks'
import { SignInForm } from 'app/features/auth/sign-in-form'

const SignInSideBar = ({ ...props }: YStackProps) => (
  <SideBar width="28%" minWidth={3} maw={405} px="$4" {...props}>
    <Stack f={1} jc="center">
      <IconSendLogo size={'$13'} />
    </Stack>
    <YStack f={1} gap="$4" ai="center" jc="center">
      <SignInForm />
    </YStack>
    <YStack gap="$4" ai="center" f={1} jc="flex-end">
      <XStack gap="$2" ai="center">
        <Paragraph size={'$1'} color={'$accentColor'}>
          Connect with us
        </Paragraph>
        <SideBarFooterLink
          icon={<IconXLogo />}
          href={twitterSocial}
          target="_blank"
          borderRadius={9999}
        />
        <SideBarFooterLink
          icon={<IconTelegramLogo />}
          href={telegramSocial}
          target="_blank"
          borderRadius={9999}
        />
      </XStack>
    </YStack>
  </SideBar>
)

export const SignInSideBarWrapper = ({ children }: { children?: React.ReactNode }) => {
  const media = useMedia()
  if (media.gtMd) {
    return (
      <SideBarWrapper sidebar={<SignInSideBar backgroundColor={'$backgroundStrong'} />}>
        {children}
      </SideBarWrapper>
    )
  }
  return children
}
