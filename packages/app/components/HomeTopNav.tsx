import { Button, H2, Header, XStack, useMedia } from '@my/ui'
import { useNav } from 'app/routers/params'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconHamburger, IconQr, IconSendLogo } from 'app/components/icons'

export function HomeTopNav({ children }: { children: string }) {
  const [nav, setNavParam] = useNav()
  const handleHomeBottomSheet = () => {
    setNavParam(nav ? undefined : 'home', { webBehavior: 'replace' })
  }

  const { resolvedTheme } = useThemeSetting()
  const iconColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$black'

  const media = useMedia()

  return (
    <Header w="100%">
      <XStack jc="space-between" fd="row" ai="center">
        <XStack $gtLg={{ display: 'none' }} ai="center" space="$2" height="$4">
          <Button
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
          <H2 fontWeight={'300'} color={'$color05'} ai={'center'}>
            {children}
          </H2>
        )}
        <Button
          $gtLg={{ display: 'none' }}
          bg="transparent"
          icon={<IconQr size={'$2.5'} color={iconColor} />}
        />
      </XStack>
    </Header>
  )
}
