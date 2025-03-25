import { useEffect } from 'react'
import { YStack, Spinner } from '@my/ui'

export function SuccessCallback() {
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({ type: 'COINBASE_ONRAMP_SUCCESS' }, window.location.origin)
      window.close()
    }
  }, [])

  return (
    <YStack f={1} ai="center" jc="center">
      <Spinner size="large" color="$primary" />
    </YStack>
  )
}
