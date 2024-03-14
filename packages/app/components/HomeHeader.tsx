import { Button, H2, Header, Link, XStack, useMedia } from '@my/ui'
import { useNav } from 'app/routers/params'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconArrowLeft, IconGear, IconHamburger, IconQr, IconSendLogo } from 'app/components/icons'
import { useRouter } from 'solito/router'
import { SettingsBottomSheet } from './settings/SettingsBottomSheet'

// TODO: this should probably named HomeTopNav
export function HomeHeader({ backLink, children }: { backLink?: string; children: string }) {
  const [nav, setNavParam] = useNav()
  const handleHomeBottomSheet = () => {
    setNavParam(nav ? undefined : 'home', { webBehavior: 'replace' })
  }

  const handleSettingsBottomSheet = () => {
    setNavParam(nav ? undefined : 'settings', { webBehavior: 'replace' })
  }

  const { resolvedTheme } = useThemeSetting()
  const iconColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$black'
  const router = useRouter()
  const media = useMedia()

  return (
    <>
      {media.lg ? <SettingsBottomSheet /> : <></>}
      <Header w="100%">
        <XStack jc="space-between" fd="row" ai="center">
          <XStack $gtLg={{ display: 'none' }} ai="center" space="$2" height="$4">
            <Button
              p={0}
              onPress={handleHomeBottomSheet}
              bg="transparent"
              icon={<IconHamburger size={'$2.5'} color={iconColor} />}
            />
          </XStack>
          {children === 'Home' && media.lg ? (
            <XStack>
              <IconSendLogo size={'$2.5'} color={'$color12'} />
            </XStack>
          ) : (
            <XStack gap={'$3.5'} ai={'center'}>
              <Link
                href={backLink ?? ''}
                $lg={{ display: 'none' }}
                $gtLg={{ display: backLink ? 'flex' : 'none' }}
              >
                <IconArrowLeft color={iconColor} />
              </Link>
              <H2 fontWeight={'300'} color={'$color05'} ai={'center'}>
                {children}
              </H2>
            </XStack>
          )}

          {media.lg ? (
            children === 'Account' || children === 'Settings' ? (
              <Button
                p={0}
                onPress={handleSettingsBottomSheet}
                bg="transparent"
                icon={<IconGear size={'$2.5'} color={iconColor} />}
              />
            ) : (
              <Button p={0} bg="transparent" icon={<IconQr size={'$2.5'} color={iconColor} />} />
            )
          ) : (
            <></>
          )}
        </XStack>
      </Header>
    </>
  )
}
