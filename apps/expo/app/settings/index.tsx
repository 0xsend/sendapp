import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AccountScreenLayout } from 'app/features/account/AccountScreenLayout'

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'Account',
        }}
      />
      <AccountScreenLayout />
    </SafeAreaView>
  )
}
