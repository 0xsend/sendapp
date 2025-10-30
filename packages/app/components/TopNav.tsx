// TopNav.tsx
import {
  Button as ButtonOg,
  type ButtonProps,
  Container,
  H2,
  Header,
  Paragraph,
  Separator,
  useMedia,
  XStack,
} from '@my/ui'
import { useRootScreenParams } from 'app/routers/params'
import { IconArrowLeft, IconSendLogo } from 'app/components/icons'
import { usePathname } from 'app/utils/usePathname'
import { useRouter } from 'solito/router'

import { Link } from 'solito/link'
import { useUser } from 'app/utils/useUser'
import AvatarMenuButton from 'app/components/AvatarMenuButton/AvatarMenuButton'

interface TopNavProps {
  header?: string
  subheader?: string
  showLogo?: boolean
  /**
   * Hide the subroute button
   * @default false
   */
  noSubroute?: boolean
  /**
   * Whether the back arrow navigates to the root path
   * @default "root"
   */
  backFunction?: 'root' | 'pop' | 'router' | 'home'
  /**
   * Show header even on greater than large screens
   * @default false
   */
  showOnGtLg?: boolean
  hideRightActions?: boolean
}

export function TopNav({
  header = '',
  subheader,
  showLogo = false,
  noSubroute = false,
  backFunction = 'root',
  showOnGtLg = false,
  hideRightActions = false,
}: TopNavProps) {
  const [queryParams] = useRootScreenParams()
  const path = usePathname()
  const parts = path.split('/').filter(Boolean)
  const { push, back } = useRouter()
  const media = useMedia()
  const { profile } = useUser()

  const handleBack = () => {
    // pop to the base path if subroute. e.g. /account/settings/edit-profile -> /account
    // else, go to home page
    if (backFunction === 'router') {
      back()
      return
    }

    const newPath = () => {
      switch (backFunction) {
        case 'home':
          return '/'
        case 'root':
          return parts.slice(0, 1).join('/')
        case 'pop':
          return parts.slice(0, parts.length - 1).join('/')
        default:
          return parts.slice(0, parts.length - 1).join('/')
      }
    }

    push(`/${newPath()}`)
  }
  //@todo Refactor this so we can put back arrows on screens that need it
  const isSubRoute =
    (!noSubroute && parts.length > 1) ||
    path.includes('/secret-shop') ||
    path.includes('/deposit') ||
    path.includes('/trade') ||
    path.includes('/leaderboard') ||
    path.includes('/earn') ||
    path.includes('/sendpot') ||
    path.includes('/feed') ||
    path.includes('/rewards') ||
    path.includes('/canton-wallet')

  return (
    <Header w="100%" $lg={{ py: '$3' }}>
      <Container
        safeAreaProps={{
          edges: { bottom: 'off' },
        }}
        $gtLg={{ jc: 'flex-start', pb: '$2', ai: 'flex-start' }}
        ai="center"
        jc="space-between"
      >
        {(() => {
          switch (true) {
            case media.gtLg && isSubRoute:
              return (
                <H2 fontWeight={'500'} col="$color12" lineHeight={32} als={'center'}>
                  {header}
                </H2>
              )
            case media.gtLg && !showOnGtLg:
              return null
            case queryParams.token !== undefined:
              return (
                <XStack ai="center" f={1}>
                  <Button onPress={handleBack}>
                    <ButtonOg.Icon>
                      <IconArrowLeft
                        size={'$1.5'}
                        color={'$primary'}
                        $theme-light={{ color: '$color12' }}
                      />
                    </ButtonOg.Icon>
                  </Button>
                  <Paragraph size={'$8'} col={'$color12'} fontWeight={'500'}>
                    {(() => {
                      switch (queryParams.token) {
                        case 'investments':
                          return 'Invest'
                        case 'stables':
                          return 'Cash'
                        default:
                          return 'Invest'
                      }
                    })()}
                  </Paragraph>
                </XStack>
              )
            case !isSubRoute:
              return (
                <>
                  {showLogo ? (
                    <XStack>
                      <Link href="/">
                        <IconSendLogo size={'$2.5'} color={'$color12'} />
                      </Link>
                    </XStack>
                  ) : (
                    <H2 fontWeight={'500'} col="$color12" lineHeight={32} als={'center'}>
                      {header}
                    </H2>
                  )}
                  <XStack
                    jc="center"
                    gap="$2"
                    opacity={hideRightActions ? 0 : 1}
                    pointerEvents={hideRightActions ? 'none' : 'unset'}
                    $gtLg={{
                      pointerEvents: 'none',
                      opacity: 0,
                    }}
                  >
                    {/* We need the buttons to be there for layout purposes */}
                    <AvatarMenuButton profile={profile} />
                  </XStack>
                </>
              )
            case showLogo:
              return (
                <>
                  <Button onPress={handleBack}>
                    <ButtonOg.Icon>
                      <IconArrowLeft
                        size={'$1.5'}
                        color={'$primary'}
                        $theme-light={{ color: '$color12' }}
                      />
                    </ButtonOg.Icon>
                  </Button>
                  <XStack>
                    <Link href="/send">
                      <IconSendLogo size={'$2.5'} color={'$color12'} />
                    </Link>
                  </XStack>
                </>
              )
            default:
              return (
                <XStack ai="center" f={1}>
                  <Button onPress={handleBack}>
                    <ButtonOg.Icon>
                      <IconArrowLeft
                        size={'$1.5'}
                        color={'$primary'}
                        $theme-light={{ color: '$color12' }}
                      />
                    </ButtonOg.Icon>
                  </Button>
                  <Paragraph size={'$8'} col={'$color12'} fontWeight={'500'}>
                    {header}
                  </Paragraph>
                </XStack>
              )
          }
        })()}
      </Container>
      {subheader && (
        <Container fd="column" safeAreaProps={{ edges: ['left', 'right'] }}>
          <Paragraph
            fontWeight={'400'}
            fontSize={'$5'}
            fontFamily={'$mono'}
            lineHeight={24}
            py="$3"
            $gtSm={{ py: '$6' }}
            $gtLg={{ pl: '$1', pb: '$6', pt: '$0' }}
            col="$color12"
          >
            {subheader}
          </Paragraph>
          <Separator w={'100%'} borderColor="$jet" $lg={{ display: 'none' }} />
        </Container>
      )}
    </Header>
  )
}

function Button(props: ButtonProps) {
  return (
    <ButtonOg
      bc="transparent"
      chromeless
      circular
      jc={'flex-start'}
      ai={'center'}
      bw={0}
      hoverStyle={{
        backgroundColor: 'transparent',
      }}
      pressStyle={{
        backgroundColor: 'transparent',
      }}
      focusStyle={{
        backgroundColor: 'transparent',
      }}
      theme="green_active"
      {...props}
    />
  )
}
