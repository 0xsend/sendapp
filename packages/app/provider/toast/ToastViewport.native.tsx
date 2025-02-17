import { ToastViewport as ToastViewportOg, useSafeAreaInsets } from '@my/ui'
import type { ToastViewportProps } from './ToastViewport'

export const ToastViewport = ({ noSafeArea }: ToastViewportProps) => {
  const insets = useSafeAreaInsets()
  if (!insets || noSafeArea) {
    return <ToastViewportOg top={0} left={0} right={0} />
  }

  return <ToastViewportOg top={insets.top + 5} left={insets.left + 5} right={insets.right + 5} />
}
