import { Button, H2, Header, Link, XStack, useMedia } from '@my/ui'
import { useNav } from 'app/routers/params'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconArrowLeft, IconHamburger, IconQr, IconSendLogo } from 'app/components/icons'
import { useRouter } from 'solito/router'

// TODO: this should probably named HomeTopNav
export function HomeHeader({ backButton, children }: { backButton?: boolean; children: string }) {
  const [nav, setNavParam] = useNav()
  const handleHomeBottomSheet = () => {
    setNavParam(nav ? undefined : 'home', { webBehavior: 'replace' })
  }

  const { resolvedTheme } = useThemeSetting()
  const iconColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$black'
  const router = useRouter()
  const media = useMedia()

  return (
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
        {children === 'Home' && media.md ? (
          <XStack>
            <IconSendLogo size={'$2.5'} color={'$color12'} />
          </XStack>
        ) : (
          <XStack gap={'$3.5'} ai={'center'}>
            <XStack
              onPress={() => router.back()}
              cursor="pointer"
              $lg={{ display: 'none' }}
              $gtLg={{ display: backButton ? 'flex' : 'none' }}
            >
              <IconArrowLeft color={iconColor} />
            </XStack>
            <H2 fontWeight={'300'} color={'$color05'} ai={'center'}>
              {children}
            </H2>
          </XStack>
        )}
        <Button
          p={0}
          $gtLg={{ display: 'none' }}
          bg="transparent"
          icon={<IconQr size={'$2.5'} color={iconColor} />}
        />
      </XStack>
    </Header>
  )
}
