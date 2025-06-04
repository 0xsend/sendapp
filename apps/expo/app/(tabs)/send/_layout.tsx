import { Stack } from 'expo-router'

export default function SendLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Send', headerShown: false }} />
      <Stack.Screen name="confirm" options={{ title: 'Confirm', headerShown: false }} />
    </Stack>
  )
}
