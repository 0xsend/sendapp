// is handled on _app.tsx
export const UniversalThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export { useRootTheme, useThemeSetting } from '@tamagui/next-theme'

// biome-ignore lint/suspicious/noExplicitAny: false positive
export const loadThemePromise = new Promise<any>((res) => res({}))
