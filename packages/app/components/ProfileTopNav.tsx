import {
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
import AvatarMenuButton from './AvatarMenuButton/AvatarMenuButton'
import { useUser } from 'app/utils/useUser'
import { isAddress } from 'viem'

export function ProfileTopNav() {
  const media = useMedia()
  const { back } = useRouter()
  const params = useParams<{ tag?: string; sendid?: string }>()

  // Use the appropriate lookup based on the route params
  const identifier = params.tag || params.sendid || ''
  // External addresses (0x...) don't need a profile lookup
  const isExternalAddress = isAddress(identifier)
  const lookupType = params.tag ? 'tag' : 'sendid'
  const { data: otherUserProfile, isLoading } = useProfileLookup(
    lookupType,
    isExternalAddress ? '' : identifier
  )
  const { profile } = useUser()

  const handleBack = () => {
    back()
  }

  // For external addresses, show no title (just back arrow)
  // For Send accounts, show name, tag, or sendid
  const headerTitle = isExternalAddress
    ? null
    : otherUserProfile?.name ||
      otherUserProfile?.main_tag_name ||
      (otherUserProfile?.sendid ? `#${otherUserProfile.sendid}` : null)

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
                color={'$primary'}
                $theme-light={{ color: '$color12' }}
              />
            </ButtonOg.Icon>
          </Button>
          {isLoading ? null : headerTitle ? (
            <Paragraph size={'$8'} col={'$color12'} fontWeight={'500'}>
              {headerTitle}
            </Paragraph>
          ) : null}
        </XStack>
        {media.gtLg ? null : (
          <XStack ai="center">
            <AvatarMenuButton profile={profile} />
          </XStack>
        )}
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
