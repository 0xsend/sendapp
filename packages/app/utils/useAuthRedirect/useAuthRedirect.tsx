import { useRouter } from 'solito/router'
import { useCallback } from 'react'
import { Platform } from 'react-native'

export default function useAuthRedirect() {
  const router = useRouter()

  const redirect = useCallback(
    (redirectUrl?: string) => {
      if (Platform.OS === 'web') {
        router.replace(redirectUrl || '/')
      } else {
        router.push('/(tabs)/')
      }
    },
    [router.replace, router.push]
  )

  return { redirect }
}
