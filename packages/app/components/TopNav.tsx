// TopNav.tsx
import {
  Avatar,
  Button as ButtonOg,
  type ButtonProps,
  Container,
  H1,
  H2,
  Header,
  LinkableAvatar,
  LinkableButton,
  Paragraph,
  Separator,
  Spinner,
  useMedia,
  XStack,
} from '@my/ui'
import { useRootScreenParams } from 'app/routers/params'
import { IconAccount, IconArrowLeft, IconDeviceReset, IconSendLogo } from 'app/components/icons'
import { usePathname } from 'app/utils/usePathname'
import { useRouter } from 'solito/router'

import { useCoinFromTokenParam } from '../utils/useCoinFromTokenParam'
import { Link } from 'solito/link'
import { useUser } from 'app/utils/useUser'
import type { Tables } from '@my/supabase/database-generated.types'

interface TopNavProps {
  header?: string
  subheader?: string
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
  hideRightActions?: boolean
}

export function AvatarMenuButton({ profile }: { profile?: Tables<'profiles'> | null }) {
  const { isLoading } = useUser()

  if (isLoading) return <Spinner size="small" color={'$color12'} alignSelf="center" p="$3" />

  return (
    <LinkableAvatar href={'/account'} size={'$3.5'} circular={true}>
      <Avatar.Image src={profile?.avatar_url ?? ''} w="100%" h="100%" objectFit="cover" />
      <Avatar.Fallback jc={'center'} ai="center" theme="green_active" bc="$color2">
        <IconAccount size={'$2'} $theme-light={{ color: '$color12' }} />
      </Avatar.Fallback>
    </LinkableAvatar>
  )
}

function ActivityMenuButton() {
  const href = '/activity'
  const location = usePathname()
  const parts = location.split('/').filter(Boolean)
  const isActiveRoute =
    location === href.toString() ||
    parts.includes(href.toString()) ||
    href.toString().startsWith(`/${parts[0]}`)

  return (
    <LinkableButton
      href={'/activity'}
      bc={'$color0'}
      p={'$2'}
      circular
      chromeless
      hoverStyle={{ bc: '$color0' }}
      pressStyle={{ bc: '$color0' }}
      focusStyle={{ bc: '$color0' }}
    >
      <LinkableButton.Icon>
        <IconDeviceReset
          size={'$1.5'}
          color={isActiveRoute ? '$primary' : '$color10'}
          $theme-light={{ color: isActiveRoute ? '$color12' : '$color10' }}
        />
      </LinkableButton.Icon>
    </LinkableButton>
  )
}

export function TopNav({
  header = '',
  subheader,
  noSubroute = false,
  backFunction = 'root',
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
    path.includes('/feed')

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
            case Boolean(queryParams.token):
              return (
                <XStack ai="center" f={1}>
                  <Button onPress={handleBack}>
                    <ButtonOg.Icon>
                      <IconArrowLeft
                        size={'$1.5'}
                        $theme-dark={{ color: '$primary' }}
                        $theme-light={{ color: '$color12' }}
                      />
                    </ButtonOg.Icon>
                  </Button>
                </XStack>
              )
            case !isSubRoute:
              return (
                <>
                  <XStack>
                    <Link href="/">
                      <H1 fontWeight={'600'} letterSpacing={1} tt="lowercase">{`/${header}`}</H1>
                      {/* <IconSendLogo size={'$2.5'} color={'$color12'} /> */}
                    </Link>
                  </XStack>
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
                    <ActivityMenuButton />
                    <AvatarMenuButton profile={profile} />
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
                        $theme-dark={{ color: '$primary' }}
                        $theme-light={{ color: '$color12' }}
                      />
                    </ButtonOg.Icon>
                  </Button>
                  <H1 fontWeight={'600'} letterSpacing={1} tt="lowercase">{`/${header}`}</H1>
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
            col="$color10"
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
