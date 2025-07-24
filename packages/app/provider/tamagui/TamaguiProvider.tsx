import { TamaguiProvider as TamaguiProviderOG } from '@my/ui'
import { Platform, Text, TextInput } from 'react-native'
import config from '../../tamagui.config'
import { useRootTheme } from '../theme/UniversalThemeProvider'
import { useMemo } from 'react'

if (Platform.OS !== 'web') {
  // @ts-expect-error some hacky way to disable font scaling, our UI is not ready for this, couldn't find any better way to disable it
  Text.defaultProps = { ...(Text.defaultProps || {}), allowFontScaling: false }
  // @ts-expect-error same for inputs
  TextInput.defaultProps = { ...(TextInput.defaultProps || {}), allowFontScaling: false }
}

export const TamaguiProvider = ({ children }: { children: React.ReactNode }) => {
  const [rootTheme] = useRootTheme()

  // memo to avoid re-render on dark/light change
  const contents = useMemo(() => {
    return children
  }, [children])

  return (
    <TamaguiProviderOG
      config={config}
      disableInjectCSS
      disableRootThemeClass
      defaultTheme={rootTheme}
    >
      {contents}
    </TamaguiProviderOG>
  )
}
