import { useRouter } from 'solito/router'
import { useCallback } from 'react'
import { consumeAfterLoginRedirect } from 'app/utils/useAfterLoginRedirect'

export default function useAuthRedirect() {
  const router = useRouter()

  const redirect = useCallback(
    (redirectUrl?: string) => {
      // Check localStorage for stored redirect (e.g., from check claim flow)
      const storedRedirect = consumeAfterLoginRedirect()
      router.replace(storedRedirect || redirectUrl || '/')
    },
    [router]
  )

  return { redirect }
}
