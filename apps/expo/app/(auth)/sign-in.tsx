import React from 'react'
import { Stack } from 'expo-router'
import { SplashScreen } from 'app/features/splash/screen'

export default function SignInScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Sign In',
          headerShown: false,
        }}
      />
      <SplashScreen />
    </>
  )
}
