// TopNav.tsx
import {
  H2,
  Header,
  Paragraph,
  XStack,
  Stack,
  useMedia,
  Button as ButtonOg,
  Container,
  Separator,
  useToastController,
  type ButtonProps,
  usePwa,
  Avatar,
} from '@my/ui'
import { useRootScreenParams } from 'app/routers/params'
import { IconAccount, IconArrowLeft, IconGear, IconQr, IconSendLogo } from 'app/components/icons'
import { usePathname } from 'app/utils/usePathname'
import { useRouter } from 'solito/router'

import { SettingsBottomSheet } from 'app/features/account/settings/SettingsBottomSheet'
import { useCoinFromTokenParam } from '../utils/useCoinFromTokenParam'
import { Link } from 'solito/link'
import { useUser } from 'app/utils/useUser'
import type { Tables } from '@my/supabase/database-generated.types'

export enum ButtonOption {
  PROFILE = 'PROFILE',
  QR = 'QR',
  SETTINGS = 'SETTINGS',
  REFERRAL = 'REFERRAL',
}

interface TopNavProps {
  header?: string
  subheader?: string
  showLogo?: boolean
  /**
   * Customize the button on the right side of the top nav.
   */
  button?: ButtonOption
  /**
   * Hide the subroute button
   * @default false
   */
  noSubroute?: boolean
  /**
   * Whether the back arrow navigates to the base path
   * @default "root"
   */
  backFunction?: 'root' | 'pop' | 'router' | 'home'
}

export function AvatarMenuButton({ profile }: { profile?: Tables<'profiles'> | null }) {
  const [queryParams, setRootParams] = useRootScreenParams()
  const handleHomeBottomSheet = () => {
    setRootParams(
      { ...queryParams, nav: queryParams.nav ? undefined : 'home' },
      { webBehavior: 'replace' }
    )
  }

  return (
    <Button
      $gtLg={{
        disabled: true,
        opacity: 0,
      }} /// We need the button to be there for layout purposes
      onPress={handleHomeBottomSheet}
      br={'$2'}
      bc="$color2"
      size={'$3.5'}
      icon={
        <Avatar size={'$3.5'} br={'$2'}>
          <Avatar.Image src={profile?.avatar_url ?? ''} w="100%" h="100%" objectFit="cover" />
          <Avatar.Fallback jc={'center'} ai="center" theme="green_active">
            <IconAccount size={'$2'} $theme-light={{ color: '$color12' }} />
          </Avatar.Fallback>
        </Avatar>
      }
    />
  )
}

export function TopNav({
  header = '',
  subheader,
  showLogo = false,
  button,
  noSubroute = false,
  backFunction = 'root',
}: TopNavProps) {
  const [queryParams, setRootParams] = useRootScreenParams()
  const path = usePathname()
  const parts = path.split('/').filter(Boolean)
  const { push, back } = useRouter()
  const media = useMedia()
  const toast = useToastController()
  const selectedCoin = useCoinFromTokenParam()
  const isPwa = usePwa()
  const { profile } = useUser()

  const handleSettingsBottomSheet = () => {
    setRootParams(
      { ...queryParams, nav: queryParams.nav ? undefined : 'settings' },
      { webBehavior: 'replace' }
    )
  }

  const hasSelectedCoin = Boolean(selectedCoin)

  const handleBack = () => {
    // pop to the base path if subroute. e.g. /account/settings/edit-profile -> /account
    // else, go to home page
    if (hasSelectedCoin) {
      setRootParams({ ...queryParams, token: undefined })
      return
    }
    if (backFunction === 'router') {
      return back()
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

    if (path.includes('/settings')) {
      push(`/${newPath()}?nav=settings`)
      return
    }

    push(`/${newPath()}`)
  }
  //@todo Refactor this so we can put back arrows on screens that need it
  const isSubRoute =
    (!noSubroute && parts.length > 1) ||
    path.includes('/secret-shop') ||
    path.includes('/deposit') ||
    path.includes('/leaderboard')

  const renderButton = () => {
    switch (true) {
      case button === undefined:
        return <Button opacity={0} disabled $gtMd={{ display: 'none' }} />
      case button === ButtonOption.QR:
        return (
          <Button
            $gtLg={{ display: 'none' }}
            icon={<IconQr size={'$2.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />}
            onPress={() => toast.show('Coming Soon')}
          />
        )
      case button === ButtonOption.SETTINGS:
        return (
          <Button
            $gtLg={{ display: 'none' }}
            icon={
              <IconGear size={'$2.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />
            }
            onPress={handleSettingsBottomSheet}
          />
        )
      case button === ButtonOption.PROFILE:
        return profile ? <AvatarMenuButton profile={profile} /> : null
      default:
        if (__DEV__) throw new Error(`Unknown button option: ${button}`)
        return null
    }
  }

  return (
    <Header w="100%">
      <Container
        $gtLg={{ jc: 'flex-start', pb: '$2', ai: 'flex-start' }}
        ai="center"
        jc="space-between"
        safeAreaPadding={isPwa && 't'}
        $lg={{ pt: !isPwa && '$5', pb: '$3' }}
      >
        {(() => {
          switch (true) {
            case media.gtLg && isSubRoute:
              return (
                <H2 fontWeight={'300'} col="$color10" lineHeight={32} als={'center'}>
                  {header}
                </H2>
              )
            case media.gtLg:
              return null
            case hasSelectedCoin:
              return (
                <XStack ai="center" f={1}>
                  <Button
                    onPress={handleBack}
                    icon={
                      <IconArrowLeft
                        size={'$1.5'}
                        color={'$primary'}
                        $theme-light={{ color: '$color12' }}
                      />
                    }
                  />
                  <Paragraph size={'$8'} col={'$color10'}>
                    Balance
                  </Paragraph>
                </XStack>
              )
            case !isSubRoute:
              return showLogo ? (
                <XStack>
                  <Link href="/">
                    <IconSendLogo size={'$2.5'} color={'$color12'} />
                  </Link>
                </XStack>
              ) : (
                <H2 fontWeight={'300'} col="$color10" lineHeight={32} als={'center'}>
                  {header}
                </H2>
              )
            case showLogo:
              return (
                <>
                  <Button
                    onPress={handleBack}
                    icon={
                      <IconArrowLeft
                        size={'$1.5'}
                        color={'$primary'}
                        $theme-light={{ color: '$color12' }}
                      />
                    }
                  />
                  <XStack>
                    <Link href="/send">
                      <IconSendLogo size={'$2.5'} color={'$color12'} />
                    </Link>
                  </XStack>
                </>
              )
            default:
              return (
                <>
                  <Button
                    onPress={handleBack}
                    icon={
                      <IconArrowLeft
                        size={'$1.5'}
                        color={'$primary'}
                        $theme-light={{ color: '$color12' }}
                      />
                    }
                  />

                  <H2 fontWeight={'300'} col="$color10" lineHeight={32} als={'center'}>
                    {header}
                  </H2>
                </>
              )
          }
        })()}

        <Stack display={isSubRoute || media.lg ? 'flex' : 'none'} jc="center" $gtLg={{ fd: 'row' }}>
          {renderButton()}
        </Stack>
      </Container>
      {subheader && (
        <Container fd="column">
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
      <SettingsBottomSheet />
    </Header>
  )
}

function Button(props: ButtonProps) {
  return (
    <ButtonOg
      bc="transparent"
      chromeless
      circular
      jc={'center'}
      ai={'center'}
      hoverStyle={{
        backgroundColor: 'transparent',
        borderColor: '$background',
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
