import { Button, Container, H3, Paragraph, ScrollView, Separator, XStack, YStack } from '@my/ui'
import {
  Activity,
  Award,
  BarChart2,
  DollarSign,
  Download,
  Gift,
  Home,
  LineChart,
  LogOut,
  Moon,
  Rss,
  Scroll,
  Search,
  Send,
  Settings,
  TrendingUp,
  User,
} from '@tamagui/lucide-icons'
import { baseMainnet } from '@my/wagmi'
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

  const menuItems = [
    { icon: <Home size={20} />, label: 'Home', route: '/(tabs)' },
    { icon: <Activity size={20} />, label: 'Activity', route: '/(tabs)/activity' },
    { icon: <Send size={20} />, label: 'Send', route: '/send' },
    { icon: <Download size={20} />, label: 'Deposit', route: '/deposit' },
    { icon: <DollarSign size={20} />, label: 'Earn', route: '/(tabs)/earn' },
    { icon: <TrendingUp size={20} />, label: 'Trade', route: '/trade' },
    { icon: <Gift size={20} />, label: 'SendPot', route: '/sendpot' },
    { icon: <Search size={20} />, label: 'Explore', route: '/explore' },
    { icon: <LineChart size={20} />, label: 'Invest', route: '/invest' },
    { icon: <Rss size={20} />, label: 'Feed', route: '/feed' },
    { icon: <Award size={20} />, label: 'Leaderboard', route: '/leaderboard' },
    ...(__DEV__ || baseMainnet.id === 84532
      ? [{ icon: <BarChart2 size={20} />, label: 'Secret Shop', route: '/secret-shop' }]
      : []),
    { icon: <Settings size={20} />, label: 'Settings', route: '/settings' },
  ]

  return (
    <ScrollView f={1}>
      <Container f={1} backgroundColor="$background">
        <YStack f={1} pt={top} pb={bottom} px="$4" gap="$6">
          <XStack py="$4" ai="center">
            <IconSendLogo size={'$6'} color={'$color12'} />
          </XStack>

          <YStack gap="$4">
            <XStack ai="center" gap="$3">
              <Button
                circular
                size="$5"
                icon={<User size={20} />}
                onPress={() => router.push('/(tabs)/profile')}
              />
              <YStack>
                <H3>{profile?.name || 'User'}</H3>
                <Paragraph color="$color10">{user?.email || ''}</Paragraph>
              </YStack>
            </XStack>
          </YStack>

          <Separator />

          <YStack f={1} gap="$4">
            {menuItems.map((item) => (
              <Button
                key={item.route}
                variant="outlined"
                onPress={() => router.push(item.route)}
                icon={item.icon}
                color="$color12"
              >
                {item.label}
              </Button>
            ))}
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
    </ScrollView>
  )
}
