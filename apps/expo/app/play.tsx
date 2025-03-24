import { PlayScreen } from 'app/features/play/screen'
import { Stack } from 'expo-router'

export default function Play() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Play',
        }}
      />
      <PlayScreen />
    </>
  )
}
