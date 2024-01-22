import { Avatar, Button, Container, H1, H2, Paragraph, Spinner, Text, XStack, YStack } from '@my/ui'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { createParam } from 'solito'

const { useParam } = createParam<{ tag: string }>()

export function ProfileScreen() {
  const [tag] = useParam('tag')
  const { data: profile, isLoading, error } = useProfileLookup(tag)

  return (
    <Container>
      <YStack f={1} gap="$6">
        {error && <Text color="$orange10">{error.message}</Text>}
        {isLoading && <Spinner size="large" color="$color10" />}
        {profile && (
          <YStack width="100%" gap="$2">
            <Avatar testID="avatar" size="$16" br="$4" gap="$2" mx="auto" $gtSm={{ mx: '0' }}>
              <Avatar.Image
                testID="avatarImage"
                accessibilityLabel={profile.name}
                accessibilityRole="image"
                accessible
                src={
                  profile.avatar_url ??
                  `https://ui-avatars.com/api.jpg?name=${profile.name ?? '??'}&size=256`
                }
              />
              <Avatar.Fallback bc="$background">??</Avatar.Fallback>
            </Avatar>
            <H1 nativeID="profileName">{profile.name}</H1>
            <H2 theme="alt1">@{tag}</H2>
            <Paragraph mb="$4">{profile.about}</Paragraph>

            <XStack jc="space-around" gap="$6" maxWidth={600}>
              <Button
                f={1}
                width={'100%'}
                onPress={() => {
                  console.log('Send', profile.address)
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
          </YStack>
        )}
      </YStack>
    </Container>
  )
}
