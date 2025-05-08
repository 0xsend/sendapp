import { Avatar, Button, Container, H4, Paragraph, Stack, XStack, YStack } from '@my/ui'
import { Edit, User } from '@tamagui/lucide-icons'
import { useUser } from 'app/utils/useUser'
import { Stack as StackRouter, useRouter } from 'expo-router'

export default function ProfileTabScreen() {
  const { profile } = useUser()
  const router = useRouter()

  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Profile',
          headerShown: false, // We'll use the header from the tabs layout
        }}
      />

      <Container
        safeAreaProps={{
          edges: ['left', 'right'],
          style: { flex: 1 },
        }}
        flex={1}
        backgroundColor="$background"
      >
        <YStack f={1} p="$4" gap="$6">
          <XStack ai="center" jc="center" gap="$4" mt="$4">
            <Stack>
              <Avatar circular size="$10">
                <Avatar.Image src={profile?.avatar_url || undefined} />
                <Avatar.Fallback bc="$color5">
                  <User size="$4" />
                </Avatar.Fallback>
              </Avatar>
            </Stack>
            <YStack f={1} gap="$2">
              <H4>{profile?.name || 'Your Name'}</H4>
              <Paragraph color="$color10">@{profile?.name}</Paragraph>
            </YStack>
          </XStack>

          <Button
            icon={<Edit size="$1" />}
            onPress={() => {
              // Navigate to edit profile page
              router.push('/settings/edit-profile')
            }}
            alignSelf="center"
            mt="$2"
          >
            Edit Profile
          </Button>

          <YStack mt="$6" gap="$4">
            <Paragraph fontSize="$6" fontWeight="bold">
              Account Details
            </Paragraph>
            <Paragraph color="$color10">
              This screen will show your profile information and account details.
            </Paragraph>
          </YStack>
        </YStack>
      </Container>
    </>
  )
}
