import { useEffect } from 'react'
import { YStack, Spinner } from '@my/ui'
import { useRouter } from 'solito/router'

export function SuccessCallback() {
  const router = useRouter()

  useEffect(() => {
    // Get session ID from URL query parameters
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get('sessionId')

    if (window.opener) {
      // Send success message back to parent window
      window.opener.postMessage(
        {
          type: 'COINBASE_ONRAMP_SUCCESS',
          sessionId: sessionId,
        },
        window.location.origin
      )

      // Close the popup window
      window.close()
    } else {
      // If no opener (user navigated directly or opened in new tab),
      // redirect to success page
      router.push('/deposit/success')
    }
  }, [router])

  return (
    <YStack f={1} ai="center" jc="center">
      <Spinner size="large" color="$primary" />
    </YStack>
  )
}
