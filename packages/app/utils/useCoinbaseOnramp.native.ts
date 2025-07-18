import { useCallback } from 'react'
import { getOnrampBuyUrl } from '@coinbase/onchainkit/fund'
import { useMutation } from '@tanstack/react-query'
import debug from 'debug'
import * as WebBrowser from 'expo-web-browser'

const log = debug('app:utils:useCoinbaseOnramp')

type OnrampStatus = 'idle' | 'pending_payment' | 'success' | 'failed' | 'payment_submitted'
interface OnrampConfig {
  projectId: string
  address: string
  partnerUserId: string
  defaultPaymentMethod?: 'APPLE_PAY' | 'CARD'
}

interface OnrampParams {
  amount: number
}

export default function useCoinbaseOnramp({
  projectId,
  address,
  partnerUserId,
  defaultPaymentMethod = 'CARD',
}: OnrampConfig) {
  const mutation = useMutation<void, Error, OnrampParams>({
    mutationFn: async ({ amount }) => {
      log('Starting transaction for:', amount, 'USD')

      const onrampUrl = getOnrampBuyUrl({
        projectId,
        addresses: {
          [address]: ['base'],
        },
        partnerUserId,
        defaultPaymentMethod,
        assets: ['USDC'],
        presetFiatAmount: amount,
        fiatCurrency: 'USD',
        redirectUrl: 'app.send://deposit/success',
      })

      await WebBrowser.openBrowserAsync(onrampUrl, {
        dismissButtonStyle: 'cancel',
        readerMode: false,
      })
    },
    onError: (error) => {
      console.error('error after closing onramp', error.message)
      log('[Transaction failed:', error.message)
      return error instanceof Error ? error : new Error('Unknown error occurred')
    },
  })

  const openOnramp = useCallback(
    (amount: number) => {
      mutation.mutate({ amount })
    },
    [mutation]
  )

  const closeOnramp = useCallback(() => {
    mutation.reset()
  }, [mutation])

  let status: OnrampStatus
  switch (true) {
    case mutation.isPending:
      status = 'pending_payment'
      break
    case mutation.isError:
      status = 'failed'
      break
    default:
      status = 'idle'
  }

  return {
    openOnramp,
    closeOnramp,
    status,
    error: mutation.error as Error | null,
    isLoading: mutation.isPending,
  }
}
