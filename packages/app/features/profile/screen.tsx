import {
  Button,
  H1,
  H2,
  Paragraph,
  Spinner,
  Text,
  XStack,
  YStack,
  useToastController,
} from '@my/ui'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useUser } from 'app/utils/useUser'
import { useRouter } from 'solito/router'
import { createParam } from 'solito'
import { AvatarProfile } from './AvatarProfile'
const { useParam } = createParam<{ sendid: string }>()
interface ProfileScreenProps {
  sendid?: string
}

export function ProfileScreen({ sendid: propSendid }: ProfileScreenProps) {
  const { user } = useUser()
  const [paramSendid] = useParam('sendid')
  const sendid = propSendid || paramSendid
  const { data: profile, isLoading, error } = useProfileLookup('sendid', sendid || '')
  const router = useRouter()
  const toast = useToastController()

  const formatTags = (tags: string[]) => tags?.map((tag) => `/${tag}`).join(' ')

  return (
    <YStack f={1} gap="$6" pt="$6" $gtMd={{ pt: '$0' }}>
      {error && <Text theme="red">{error.message}</Text>}
      {isLoading && <Spinner size="large" color="$color10" />}
      {profile ? (
        <YStack width="100%" gap="$2">
          <AvatarProfile profile={profile} /> <H1 nativeID="profileName">{profile.name}</H1>
          <H2 theme="alt1">{formatTags(profile.all_tags ?? [])}</H2>
          <Paragraph mb="$4">{profile.about}</Paragraph>
          {profile && user?.id !== profile?.id ? (
            <XStack jc="space-around" gap="$6" maxWidth={600}>
              <Button
                testID="openSendDialogButton"
                f={1}
                width={'100%'}
                onPress={() => {
                  router.push({
                    pathname: '/send',
                    query: {
                      recipient: profile.tag ?? profile.sendid,
                      idType: profile.tag ? 'tag' : 'sendid',
                    },
                  })
                }}
                theme="green"
              >
                Send
              </Button>
              <Button
                f={1}
                width={'100%'}
                onPress={() => {
                  console.log('Request', profile.address)
                  toast.show('Coming Soon')
                }}
              >
                Request
              </Button>
            </XStack>
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  )
}
