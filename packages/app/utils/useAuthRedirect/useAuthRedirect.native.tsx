import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { consumeAfterLoginRedirect } from 'app/utils/afterLoginRedirect'

export default function useAuthRedirect() {
  const router = useRouter()

  const redirect = useCallback(
    (redirectUrl?: string) => {
      router.dismissAll()
      // Check for stored redirect (e.g., from check claim flow)
      const storedRedirect = consumeAfterLoginRedirect()
      const target = storedRedirect || redirectUrl || '/(tabs)/home'
      router.replace(target as never)
    },
    [router]
  )

  return { redirect }
}
