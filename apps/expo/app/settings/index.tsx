import { AccountScreen } from 'app/features/account/screen'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'Account',
        }}
      />
      <AccountScreen />
    </SafeAreaView>
  )
}
