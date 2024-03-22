import {
  H2,
  Header,
  Paragraph,
  XStack,
  Stack,
  useMedia,
  Button,
  Container,
  Separator,
} from '@my/ui'
import { useNav } from 'app/routers/params'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconArrowLeft, IconHamburger, IconQr, IconSendLogo } from 'app/components/icons'
import { usePathname } from 'app/utils/usePathname'
import { useRouter } from 'solito/router'

export function HomeTopNav({ header, subheader }: { header: string; subheader?: string }) {
  const [nav, setNavParam] = useNav()
  const path = usePathname()
  const parts = path.split('/').filter(Boolean)
  const { push } = useRouter()

  const handleHomeBottomSheet = () => {
    setNavParam(nav ? undefined : 'home', { webBehavior: 'replace' })
  }

  const handleBack = () => {
    const newPath = parts.slice(0, -1).join('/') || '/'
    push(`/${newPath}`)
  }

  const { resolvedTheme } = useThemeSetting()
  const iconColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$black'

  const media = useMedia()

  const isSubRoute = parts.length > 1

  return (
    <Header w="100%" $md={{ pb: '$6' }} $gtMd={{ pb: '$10' }}>
      <Stack>
        <Container
          $gtLg={{ jc: 'flex-start', pb: '$2', ai: 'flex-start' }}
          ai="center"
          jc="space-between"
          fd="row"
          $lg={{ py: '$4' }}
        >
          <Stack display={isSubRoute || media.lg ? 'flex' : 'none'} jc="center">
            {isSubRoute ? (
              <Button
                outlineColor={'transparent'}
                focusStyle={{ outlineColor: 'transparent' }}
                onPress={handleBack}
                bg="transparent"
                $gtLg={{ ai: 'flex-start' }}
                hoverStyle={{ backgroundColor: 'transparent', borderColor: 'transparent' }}
                pressStyle={{ backgroundColor: 'transparent', borderColor: 'transparent' }}
                icon={<IconArrowLeft size={'$2.5'} color={iconColor} />}
                pl="$0"
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
          {header === 'Home' && media.lg ? (
            <XStack>
              <IconSendLogo size={'$2.5'} color={'$color12'} />
            </XStack>
          ) : (
            <H2 fontWeight={'300'} color={'$color05'} lineHeight={32}>
              {header}
            </H2>
          )}
          <Button
            $gtLg={{ display: 'none' }}
            bg="transparent"
            icon={<IconQr size={'$2.5'} color={iconColor} />}
          />
        </Container>
        <Container $gtLg={{ als: 'flex-start' }}>
          {subheader && (
            <Paragraph
              fontWeight={'400'}
              fontSize={'$5'}
              fontFamily={'$mono'}
              lineHeight={24}
              py="$3"
              $gtSm={{ py: '$6' }}
              $gtLg={{ ml: '$9', pl: '$1', pb: '$4', pt: '$0' }}
              $theme-light={{ col: '$gray10Light' }}
              $theme-dark={{ col: '$gray10Dark' }}
            >
              {subheader}
            </Paragraph>
          )}
        </Container>
        <Separator
          w={'100%'}
          position="absolute"
          bottom={0}
          $lg={{ bc: '$black' }}
          $gtLg={{ display: 'none' }}
        />
      </Stack>
    </Header>
  )
}
