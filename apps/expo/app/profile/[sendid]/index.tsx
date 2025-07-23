import { Stack } from 'expo-router'
import { ProfileScreen } from 'app/features/profile/screen'
import { ScrollView } from '@my/ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Screen() {
  const insets = useSafeAreaInsets()
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
      <ScrollView
        flex={1}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        overflow={'visible'}
        bounces={false}
        overScrollMode="always" // Android scroll indicator
      >
        <ProfileScreen />
      </ScrollView>
    </>
  )
}
