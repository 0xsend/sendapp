import {
  Avatar,
  Button as ButtonOg,
  type ButtonProps,
  Container,
  Header,
  Paragraph,
  useMedia,
  XStack,
} from '@my/ui'
import { IconArrowLeft } from 'app/components/icons'
import { useRouter } from 'solito/router'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useParams } from 'next/navigation'

interface ProfileTopNavProps {
  /**
   * Whether the back arrow navigates to the root path
   * @default "router"
   */
  backFunction?: 'root' | 'pop' | 'router' | 'home'
}

export function ProfileTopNav({ backFunction = 'router' }: ProfileTopNavProps) {
  const { back } = useRouter()
  const media = useMedia()
  const params = useParams<{ tag?: string; sendid?: string }>()

  // Use the appropriate lookup based on the route params
  const lookupType = params.tag ? 'tag' : 'sendid'
  const identifier = params.tag || params.sendid || ''
  const { data: profile } = useProfileLookup(lookupType, identifier)

  const handleBack = () => {
    back()
  }

  // Don't render on large screens or if no profile data
  if (media.gtLg || !profile) {
    return null
  }

  return (
    <Header w="100%" $lg={{ py: '$3' }}>
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
                {((profile?.name || profile?.main_tag_name || 'U')[0] || 'U').toUpperCase()}
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
