import { useSendAccount } from 'app/utils/send-accounts'
import { usePathname } from 'app/utils/usePathname'
import { useEffect } from 'react'
import { useRouter } from 'solito/router'

/**
 * This concern is used to ensure that the user is onboarded before rendering the children.
 * In the web app, this is handled by a middleware that redirects to the onboarding page if the user is not onboarded.
 *
 * However, we also need to handle this client side for the native app.
 */
export function OnboardedConcern({ children }: { children: React.ReactNode }) {
  const sendAccount = useSendAccount()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // we don't know yet if they need to be onboarded or we encountered an error let the children deal with it
    if (!sendAccount.isFetched || sendAccount.isError) {
      return
    }

    if (!sendAccount.data && pathname !== '/auth/onboarding') {
      router.push('/auth/onboarding')
      return
    }
  }, [sendAccount, pathname, router])

  // let the user through, they'll be redirected if they need to be onboarded
  return children
}
