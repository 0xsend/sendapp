import { Button, Container, H3, Paragraph, Separator, XStack, YStack } from '@my/ui'
import { LogOut, Moon, Settings, User } from '@tamagui/lucide-icons'
import { IconSendLogo } from 'app/components/icons'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { Redirect, useRouter } from 'expo-router'
import { Drawer } from 'expo-router/drawer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Layout() {
  const { session } = useUser()

  // Redirect to root if not logged in to prevent accessing the drawer
  if (!session) {
    return <Redirect href="/" />
  }

  return <Drawer drawerContent={ProfileScreen} />
}

function ProfileScreen() {
  const { top, bottom } = useSafeAreaInsets()
  const supabase = useSupabase()
  const router = useRouter()
  const { user, profile } = useUser()

  return (
    <Container f={1} backgroundColor="$background">
      <YStack f={1} pt={top} pb={bottom} px="$4" gap="$6">
        <XStack py="$4" ai="center">
          <IconSendLogo size={'$6'} color={'$color12'} />
        </XStack>

        <YStack gap="$4">
          <XStack ai="center" gap="$3">
            <Button circular size="$5" icon={<User size={20} />} />
            <YStack>
              <H3>{profile?.name || 'User'}</H3>
              <Paragraph color="$color10">{user?.email || ''}</Paragraph>
            </YStack>
          </XStack>
        </YStack>

        <Separator />

        <YStack f={1} gap="$4">
          <Button
            variant="outlined"
            onPress={() => {
              router.push('/settings')
            }}
            icon={<Settings size={20} />}
            color="$color12"
          >
            Settings
          </Button>

          <Button variant="outlined" icon={<Moon size={20} />} color="$color12">
            Dark Mode
          </Button>
        </YStack>

        <Button
          onPress={async () => {
            await supabase.auth.signOut()
            router.push('/')
          }}
          theme="red"
          icon={<LogOut size={20} />}
        >
          Sign Out
        </Button>
      </YStack>
    </Container>
  )
}
