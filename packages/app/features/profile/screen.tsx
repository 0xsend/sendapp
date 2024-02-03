import { Button, Container, H1, H2, Paragraph, Spinner, Text, XStack, YStack } from '@my/ui'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useUser } from 'app/utils/useUser'
import { useState } from 'react'
import { createParam } from 'solito'
import { SendDialog } from './SendDialog'
import { AvatarProfile } from './AvatarProfile'

const { useParam } = createParam<{ tag: string }>()

export function ProfileScreen() {
  const { user } = useUser()
  const [tag] = useParam('tag')
  const { data: profile, isLoading, error } = useProfileLookup(tag)
  const [showSendModal, setShowSendModal] = useState(false)

  return (
    <Container>
      <YStack f={1} gap="$6">
        {error && <Text theme="error">{error.message}</Text>}
        {isLoading && <Spinner size="large" color="$color10" />}
        {profile ? (
          <YStack width="100%" gap="$2">
            <AvatarProfile profile={profile} /> <H1 nativeID="profileName">{profile.name}</H1>
            <H2 theme="alt1">@{tag}</H2>
            <Paragraph mb="$4">{profile.about}</Paragraph>
            {profile && user?.id !== profile?.id ? (
              <XStack jc="space-around" gap="$6" maxWidth={600}>
                <Button
                  f={1}
                  width={'100%'}
                  onPress={() => {
                    setShowSendModal(true)
                  }}
                  theme="accent"
                >
                  Send
                </Button>
                <Button
                  f={1}
                  width={'100%'}
                  onPress={() => {
                    console.log('Request', profile.address)
                  }}
                >
                  Request
                </Button>
              </XStack>
            ) : null}
            <SendDialog profile={profile} open={showSendModal} onOpenChange={setShowSendModal} />
          </YStack>
        ) : null}
      </YStack>
    </Container>
  )
}
