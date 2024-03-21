import { H2, Header, XStack, Stack, useMedia, Button, Container } from '@my/ui'
import { useNav } from 'app/routers/params'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconArrowLeft, IconGear, IconHamburger, IconSendLogo } from 'app/components/icons'
import { usePathname } from 'app/utils/usePathname'
import { useRouter } from 'solito/router'
import { SettingsBottomSheet } from './settings/SettingsBottomSheet'
import { assert } from 'app/utils/assert'

// there's not much difference between this and HomeTopNav, but it's too much to refactor in one go
// @dev handleBack pops to the base of the path instead of the previous path
export function AccountTopNav({ header, subheader }: { header: string; subheader?: string }) {
  const [nav, setNavParam] = useNav()
  const path = usePathname()
  const { push } = useRouter()
  const media = useMedia()

  const handleHomeBottomSheet = () => {
    setNavParam(nav ? undefined : 'home', { webBehavior: 'replace' })
  }

  const handleSettingsBottomSheet = () => {
    setNavParam(nav ? undefined : 'settings', { webBehavior: 'replace' })
  }

  const handleBack = () => {
    // URLs should be like /account/settings/edit-profile, so we need to pop to /account
    const newPath = path.split('/').slice(0, 2).join('/')
    assert(!!newPath, 'newPath should not be empty')
    push(newPath)
  }

  const { resolvedTheme } = useThemeSetting()
  const iconColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$black'
  const isSubRoute = path.split('/').length - 1 > 1

  return (
    <Header w="100%" pb={'$10'} $md={{ pb: '$12' }}>
      <Container
        $gtLg={{ jc: 'flex-start', pb: '$2' }}
        jc="space-between"
        fd="row"
        $lg={{ borderBottomColor: '$gray11Light', borderBottomWidth: '$1', py: '$4' }}
      >
        <Stack $gtLg={{ display: 'none' }}>
          {isSubRoute ? (
            <Button
              outlineColor={'transparent'}
              focusStyle={{ outlineColor: 'transparent' }}
              onPress={handleBack}
              bg="transparent"
              ai="flex-start"
              hoverStyle={{ backgroundColor: 'transparent', borderColor: 'transparent' }}
              pressStyle={{ backgroundColor: 'transparent', borderColor: 'transparent' }}
              icon={<IconArrowLeft size={'$2.5'} color={iconColor} />}
            />
          ) : (
            <Button
              $gtLg={{ disabled: true, opacity: 0 }} // We need the button to be there for layout purposes
              onPress={handleHomeBottomSheet}
              bg="transparent"
              icon={<IconHamburger size={'$2.5'} color={iconColor} />}
            />
          )}
        </Stack>
        {header === '' ? (
          <XStack>
            <IconSendLogo size={'$2.5'} color={'$color12'} />
          </XStack>
        ) : (
          <H2 fontWeight={'300'} color={'$color05'} lineHeight={32}>
            {media.lg && subheader ? subheader : header}
          </H2>
        )}
        <Button
          $gtLg={{ display: 'none' }}
          bg="transparent"
          icon={<IconGear size={'$2.5'} color={iconColor} />}
          onPress={handleSettingsBottomSheet}
        />
      </Container>
      <SettingsBottomSheet />
    </Header>
  )
}
