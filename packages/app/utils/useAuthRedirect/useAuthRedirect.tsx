import { useRouter } from 'solito/router'
import { useCallback } from 'react'

export default function useAuthRedirect() {
  const router = useRouter()

  const redirect = useCallback(
    (redirectUrl?: string) => {
      router.replace(redirectUrl || '/')
    },
    [router]
  )

  return { redirect }
}
