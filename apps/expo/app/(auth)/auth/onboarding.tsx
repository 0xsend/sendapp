import { Stack } from 'expo-router'

export default function OnboardingScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Onboarding',
        }}
      />
      <OnboardingScreen />
    </>
  )
}
