import { useRouter } from 'expo-router'
import { useCallback } from 'react'

export default function useAuthRedirect() {
  const router = useRouter()

  const redirect = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (redirectUrl?: string) => {
      router.dismissAll()
      router.replace('/(tabs)/home')
    },
    [router]
  )

  return { redirect }
}
