import React, { useState } from 'react'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Provider } from 'app/provider'
import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'
import { AuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import type { GetPlaiceholderImage } from 'app/utils/getPlaiceholderImage'

export default function AuthLayout() {
  const scheme = useColorScheme()
  const [carouselImages, setCarouselImages] = useState<GetPlaiceholderImage[]>([])
  const [carouselProgress, setCarouselProgress] = useState(0)

  return (
    <Provider>
      <AuthCarouselContext.Provider
        value={{
          carouselImages,
          setCarouselImages,
          carouselProgress,
          setCarouselProgress,
        }}
      >
        <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: scheme === 'dark' ? '#000' : '#fff' },
            }}
          />
        </ThemeProvider>
      </AuthCarouselContext.Provider>
    </Provider>
  )
}
