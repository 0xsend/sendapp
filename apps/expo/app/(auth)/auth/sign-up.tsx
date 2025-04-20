import { SignUpScreen } from 'app/features/auth/sign-up/screen'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Sign Up',
        }}
      />
      <SignUpScreen />
    </>
  )
}
