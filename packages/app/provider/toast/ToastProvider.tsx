import { CustomToast, ToastProvider as ToastProviderOG } from '@my/ui'
import { ToastViewport, type ToastViewportProps } from './ToastViewport'

export const ToastProvider = ({
  children,
  ...viewportProps
}: { children: React.ReactNode } & ToastViewportProps) => {
  return (
    <ToastProviderOG swipeDirection="up" swipeThreshold={20} duration={6000}>
      {children}
      <ToastViewport {...viewportProps} />
      <CustomToast />
    </ToastProviderOG>
  )
}
