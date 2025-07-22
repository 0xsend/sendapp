import { useCallback } from 'react'
import { useToastController } from '@tamagui/toast'
import { Platform } from 'react-native'

// Extract the exact types from Tamagui's useToastController
type ToastController = ReturnType<typeof useToastController>
type ShowOptions = Parameters<ToastController['show']>[1]

// New enhanced wrapper with default configuration
export const useAppToast = () => {
  const toast = useToastController()

  const show = useCallback(
    (message: string, options?: ShowOptions) => {
      const defaultOptions: ShowOptions = {
        burntOptions: {
          preset: 'done',
          haptic: 'success',
        },
        native: Platform.OS !== 'web',
        ...options,
      }

      toast.show(message, defaultOptions)
    },
    [toast.show]
  )

  const error = useCallback(
    (message: string, options?: ShowOptions) => {
      show(message, {
        burntOptions: {
          preset: 'error',
          haptic: 'error',
        },
        customData: {
          theme: 'red',
        },
        ...options,
      })
    },
    [show]
  )

  return {
    show,
    hide: toast.hide,
    error,
  }
}
