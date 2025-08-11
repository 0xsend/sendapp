import { useSafeAreaInsets } from '@my/ui'

export const useTabBarSize = () => {
  const insets = useSafeAreaInsets()
  const padding = 10
  const iconSize = 24

  return {
    padding,
    height: iconSize + 2 * padding + Math.max(insets.bottom, 25) * 2,
  }
}
