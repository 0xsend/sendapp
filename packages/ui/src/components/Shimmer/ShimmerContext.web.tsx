import type { FunctionComponent } from 'react'
import type { GradientConfig } from './LinearGradient'
import { createStyledContext } from 'tamagui'

interface ShimmerContextType {
  gradientConfig?: GradientConfig
}

const ShimmerContext = createStyledContext<ShimmerContextType>()

export const useShimmer = () => {
  const ctx = ShimmerContext.useStyledContext()
  // On web, shimmer context is optional since we use CSS animations
  return ctx as ShimmerContextType | null
}

interface ShimmerProviderProps {
  children?: React.ReactNode
  duration?: number
  gradientConfig?: GradientConfig
}

export const ShimmerProvider: FunctionComponent<ShimmerProviderProps> = ({
  children,
  gradientConfig,
}) => {
  // On web, we don't need complex shimmer coordination
  // CSS animations handle it automatically
  return (
    <ShimmerContext.Provider gradientConfig={gradientConfig}>{children}</ShimmerContext.Provider>
  )
}
