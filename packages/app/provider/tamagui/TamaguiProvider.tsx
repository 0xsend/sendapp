import { TamaguiProvider as TamaguiProviderOG } from '@my/ui'

import config from '../../tamagui.config'
import { useRootTheme } from '../theme/UniversalThemeProvider'
import { useMemo } from 'react'

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
