import { ToastViewport as ToastViewportOg, useSafeAreaInsets } from '@my/ui'
import type { ToastViewportProps } from './ToastViewport'

export const ToastViewport = ({ noSafeArea }: ToastViewportProps) => {
  const { top, left, right } = useSafeAreaInsets()
  if (noSafeArea) {
    return <ToastViewportOg top={0} left={0} right={0} />
  }

  return <ToastViewportOg top={top + 5} left={left + 5} right={right + 5} />
}
