import { Button, H2, Header, Paragraph, XStack, useMedia } from '@my/ui'
import { useNav } from 'app/routers/params'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconArrowLeft, IconHamburger, IconQr, IconSendLogo } from 'app/components/icons'
import { usePathname } from 'app/utils/usePathname'
import { useRouter } from 'solito/router'

export function HomeTopNav({ header, subheader }: { header: string; subheader?: string }) {
  const [nav, setNavParam] = useNav()
  const path = usePathname()
  const { push } = useRouter()
  const handleHomeBottomSheet = () => {
    setNavParam(nav ? undefined : 'home', { webBehavior: 'replace' })
  }

  const handleBack = () => {
    const newPath = path.split('/').slice(0, -1).join('/')
    push(newPath)
  }

  const { resolvedTheme } = useThemeSetting()
  const iconColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$black'

  const media = useMedia()

  const isSubRoute = path.split('/').length - 1 > 1

  return (
    <Header w="100%">
      <XStack
        $gtLg={{ jc: 'flex-start', py: '$2' }}
        jc="space-between"
        fd="row"
        ai="center"
        $lg={{ borderBottomColor: '$gray11Light', borderBottomWidth: '$1', py: '$4' }}
      >
        <XStack ai="center" space="$2" height="$4">
          {isSubRoute ? (
            <Button
              outlineColor={'transparent'}
              focusStyle={{ outlineColor: 'transparent' }}
              onPress={handleBack}
              bg="transparent"
              icon={<IconArrowLeft size={'$2.5'} color={iconColor} />}
            />
          ) : (
            <Button
              $gtLg={{ display: 'none' }}
              onPress={handleHomeBottomSheet}
              bg="transparent"
              icon={<IconHamburger size={'$2.5'} color={iconColor} />}
            />
          )}
        </XStack>
        {header === 'Home' && media.md ? (
          <XStack>
            <IconSendLogo size={'$2.5'} color={'$color12'} />
          </XStack>
        ) : (
          <H2 fontWeight={'300'} color={'$color05'} ai={'center'}>
            {header}
          </H2>
        )}
        <Button
          $gtLg={{ display: 'none' }}
          bg="transparent"
          icon={<IconQr size={'$2.5'} color={iconColor} />}
        />
      </XStack>
      {subheader && (
        <Paragraph
          fontWeight={'400'}
          fontFamily={'$mono'}
          lineHeight={24}
          px="$6"
          $lg={{ py: '$6' }}
          $gtLg={{ ml: '$7', pb: '$4' }}
          $theme-light={{ col: '$gray10Light' }}
          $theme-dark={{ col: '$gray10Dark' }}
        >
          {subheader}
        </Paragraph>
      )}
    </Header>
  )
}
