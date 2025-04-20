import { useIsomorphicLayoutEffect } from '@my/ui'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import type {
  ThemeProviderProps,
  useThemeSetting as next_useThemeSetting,
} from '@tamagui/next-theme'
import { StatusBar } from 'expo-status-bar'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Appearance, useColorScheme } from 'react-native'

type ThemeContextValue = (ThemeProviderProps & { current?: string | null }) | null
export const ThemeContext = createContext<ThemeContextValue>(null)

type ThemeName = 'light' | 'dark' | 'system'

// start early
let persistedTheme: ThemeName | null = null
export const loadThemePromise = AsyncStorage.getItem('@preferred_theme')
loadThemePromise.then((val) => {
  persistedTheme = val as ThemeName
})

export const UniversalThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [current, setCurrent] = useState<ThemeName | null>(null) // Start with null
  const systemTheme = useColorScheme() || 'system'

  useIsomorphicLayoutEffect(() => {
    async function main() {
      await loadThemePromise
      setCurrent(persistedTheme ?? 'system') // Set theme after loading
    }
    main()
  }, [])

  useEffect(() => {
    if (current) {
      AsyncStorage.setItem('@preferred_theme', current)
    }
  }, [current])

  const themeContext = useMemo(() => {
    return {
      themes: ['light', 'dark'],
      onChangeTheme: (next: string) => {
        setCurrent(next as ThemeName)
      },
      current: current ?? 'system', // Default to 'system' if current is null
      systemTheme,
    } satisfies ThemeContextValue
  }, [current, systemTheme])

  if (current === null) {
    return null // Render nothing until theme is loaded
  }

  return (
    <ThemeContext.Provider value={themeContext}>
      <InnerProvider>{children}</InnerProvider>
    </ThemeContext.Provider>
  )
}

const InnerProvider = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useThemeSetting()

  // ensure we set color scheme as soon as possible
  if (resolvedTheme !== Appearance.getColorScheme()) {
    if (resolvedTheme === 'light' || resolvedTheme === 'dark') {
      Appearance.setColorScheme(resolvedTheme)
    }
  }

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

  const resolvedTheme =
    context.current === 'system' ? context.systemTheme : (context.current ?? 'system')

  const outputContext: ReturnType<typeof next_useThemeSetting> = {
    ...context,
    systemTheme: context.systemTheme as 'light' | 'dark',
    // biome-ignore lint/style/noNonNullAssertion: false positive
    themes: context.themes!,
    current: context.current ?? 'system',
    resolvedTheme,
    set: (value) => {
      context.onChangeTheme?.(value)
    },
    toggle: () => {
      const map = {
        light: 'dark',
        dark: 'system',
        system: 'light',
      }
      context.onChangeTheme?.(map[(context.current as ThemeName) ?? 'system'])
    },
  }

  return outputContext
}

export const useRootTheme = () => {
  const context = useThemeSetting()
  return [context.current === 'system' ? context.systemTheme : context.current, context.set]
}
