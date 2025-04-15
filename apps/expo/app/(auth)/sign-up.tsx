import React from 'react'
import { Stack } from 'expo-router'
import { SignUpScreen } from 'app/features/auth/sign-up/screen'

export default function SignUpRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Sign Up',
          headerShown: false,
        }}
      />
      <SignUpScreen />
    </>
  )
}
