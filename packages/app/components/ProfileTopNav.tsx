import {
  Avatar,
  Button as ButtonOg,
  type ButtonProps,
  Container,
  H2,
  Header,
  Image,
  Paragraph,
  useMedia,
  XStack,
} from '@my/ui'
import { IconArrowLeft } from 'app/components/icons'
import { useRouter } from 'solito/router'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import type { Functions } from '@my/supabase/database.types'

interface ProfileTopNavProps {
  /**
   * Profile sendid to lookup and display
   */
  sendid?: number | string
  /**
   * Profile tag to lookup and display
   */
  tag?: string
  /**
   * Whether the back arrow navigates to the root path
   * @default "router"
   */
  backFunction?: 'root' | 'pop' | 'router' | 'home'
}

export function ProfileTopNav({ sendid, tag, backFunction = 'router' }: ProfileTopNavProps) {
  const { back } = useRouter()
  const media = useMedia()

  // Use the appropriate lookup based on what's provided
  const lookupType = tag ? 'tag' : 'sendid'
  const identifier = tag || sendid?.toString() || ''
  const { data: profile } = useProfileLookup(lookupType, identifier)

  const handleBack = () => {
    back()
  }

  // Don't render on large screens or if no profile data
  if (media.gtLg || !profile) {
    return null
  }

  return (
    <Header w="100%">
      <Container
        safeAreaProps={{
          edges: { bottom: 'off' },
        }}
        ai="center"
        jc="space-between"
      >
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
          <Paragraph size={'$8'} col={'$color12'} fontWeight={'500'}>
            {profile.name || profile.main_tag_name || `#${profile.sendid}`}
          </Paragraph>
        </XStack>
        <XStack ai="center">
          <Avatar size={'$3'} circular>
            <Avatar.Image src={profile.avatar_url || ''} w="100%" h="100%" objectFit="cover" />
            <Avatar.Fallback jc={'center'} ai="center" theme="green_active" bc="$color2">
              <Paragraph size={'$4'} fontWeight={'600'}>
                {(profile.name || profile.main_tag_name || 'U')[0].toUpperCase()}
              </Paragraph>
            </Avatar.Fallback>
          </Avatar>
        </XStack>
      </Container>
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
