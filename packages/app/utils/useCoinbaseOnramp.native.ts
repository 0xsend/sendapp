import { useCallback } from 'react'
import { getOnrampBuyUrl, type GetOnrampUrlWithSessionTokenParams } from '@coinbase/onchainkit/fund'
import { useMutation } from '@tanstack/react-query'
import debug from 'debug'
import * as WebBrowser from 'expo-web-browser'
import { api } from 'app/utils/api'

const log = debug('app:utils:useCoinbaseOnramp')

type OnrampStatus = 'idle' | 'pending_payment' | 'success' | 'failed' | 'payment_submitted'
interface OnrampConfig {
  address: string
  partnerUserId: string
  defaultPaymentMethod?: 'APPLE_PAY' | 'CARD'
}

interface OnrampParams {
  amount: number
}

export default function useCoinbaseOnramp({
  address,
  partnerUserId,
  defaultPaymentMethod = 'CARD',
}: OnrampConfig) {
  const { mutateAsync: getSessionTokenMutateAsync } = api.onramp.getSessionToken.useMutation()

  const mutation = useMutation<void, Error, OnrampParams>({
    mutationFn: async ({ amount }) => {
      log('Starting transaction for:', amount, 'USD')

      const addresses = [
        {
          address,
          blockchains: ['base'],
        },
      ]

      const assets = ['USDC']

      const { token } = await getSessionTokenMutateAsync({ addresses, assets })

      const params: GetOnrampUrlWithSessionTokenParams = {
        sessionToken: token,
        partnerUserId,
        defaultPaymentMethod,
        presetFiatAmount: amount,
        fiatCurrency: 'USD',
        redirectUrl: 'send://deposit/success',
      }

      const onrampUrl = getOnrampBuyUrl(params)

      await WebBrowser.openBrowserAsync(onrampUrl, {
        dismissButtonStyle: 'cancel',
        readerMode: false,
        createTask: true,
        showTitle: true,
        enableBarCollapsing: false,
        showInRecents: true,
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
