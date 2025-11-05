import { useCallback } from 'react'
import { Platform } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Linking from 'expo-linking'
import { useAppToast } from '@my/ui'
import { api } from './api'

/**
 * Generates Canton Wallet invite URLs and handles platform-specific UX:
 * - Web copies the invite link to the clipboard (new vs existing messaging)
 * - Native tries to open the HTTPS link and falls back to clipboard if Linking fails
 */
export function useCantonWallet() {
  const toast = useAppToast()

  const mutation = api.cantonWallet.generatePriorityToken.useMutation({
    onSuccess: async (data) => {
      const { url, isNew } = data

      if (Platform.OS === 'web') {
        // Web: use expo-clipboard to avoid focus issues with navigator.clipboard
        try {
          await Clipboard.setStringAsync(url)
          if (!isNew) {
            toast.show('Your existing invite link has been copied')
          } else {
            toast.show('Priority invite link copied!')
          }
        } catch (error) {
          toast.error('Failed to copy invite link')
        }
      } else {
        // Native: try opening the URL directly, fallback to clipboard on failure
        try {
          await Linking.openURL(url)
          toast.show('Opening Canton Wallet...')
        } catch {
          await Clipboard.setStringAsync(url)
          toast.show('Invite link copied to clipboard')
        }
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to generate invite'
      toast.error(message || 'Failed to generate invite')
    },
  })

  const generatePriorityToken = useCallback(() => {
    mutation.mutate({})
  }, [mutation.mutate])

  return {
    generatePriorityToken,
    isGenerating: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  }
}
