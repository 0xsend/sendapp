import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import type {
  ThemeProviderProps,
  useThemeSetting as next_useThemeSetting,
} from '@tamagui/next-theme'
import {
  type ThemePreference,
  setThemePreference,
  useThemePreference,
} from '@vonovak/react-native-theme-control'
import { StatusBar } from 'expo-status-bar'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AppState, type ColorSchemeName, useColorScheme } from 'react-native'

export const ThemeContext = createContext<
  (ThemeProviderProps & { current: ThemeName | null }) | null
>(null)

type ThemeName = 'light' | 'dark' | 'system'

export const UniversalThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const current = useThemePreference()
  const systemTheme = useNonFlickeringColorScheme()

  const themeContext = useMemo(() => {
    const set = (val: string) => {
      setThemePreference(val as ThemePreference)
    }

    return {
      set,
      themes: ['light', 'dark'],
      onChangeTheme: set,
      current,
      systemTheme: systemTheme as string,
    }
  }, [current, systemTheme])

  return (
    <ThemeContext.Provider value={themeContext}>
      <InnerProvider>{children}</InnerProvider>
    </ThemeContext.Provider>
  )
}

const InnerProvider = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useThemeSetting()

  return (
    <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeProvider>
  )
}

export const useThemeSetting: typeof next_useThemeSetting = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useThemeSetting should be used within the context provider.')
  }

  const outputContext: ReturnType<typeof next_useThemeSetting> = {
    ...context,
    systemTheme: context.systemTheme as 'light' | 'dark',
    // biome-ignore lint/style/noNonNullAssertion: context.themes should always defined
    themes: context.themes!,
    current: context.current ?? 'system',
    resolvedTheme: context.current === 'system' ? context.systemTheme : context.current ?? 'system',
    set: (value) => {
      context.onChangeTheme?.(value)
    },
    toggle: () => {
      const map = {
        light: 'dark',
        dark: 'system',
        system: 'light',
      }
      context.onChangeTheme?.(map[context.current ?? 'system'])
    },
  }

  return outputContext
}

export const useRootTheme = () => {
  const context = useThemeSetting()
  return [context.current === 'system' ? context.systemTheme : context.current, context.set]
}

// fix flash of wrong theme on iOS:
// https://github.com/bluesky-social/social-app/pull/1417
// wait on merge from react-native to remove:
// https://github.com/facebook/react-native/pull/39439
function useNonFlickeringColorScheme() {
  const colorSchemeFromRN = useColorScheme()
  const [nonFlickerScheme, setNonFlickerScheme] = useState<ColorSchemeName>(colorSchemeFromRN)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      const isActive = state === 'active'
      if (!isActive) return
      setNonFlickerScheme(colorSchemeFromRN)
    })

    return () => {
      subscription.remove()
    }
  }, [colorSchemeFromRN])

  return nonFlickerScheme || 'system'
}
