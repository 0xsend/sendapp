import { useState, useCallback } from 'react'
import { getOnrampBuyUrl } from '@coinbase/onchainkit/fund'
import { useMutation } from '@tanstack/react-query'

type OnrampStatus = 'idle' | 'pending' | 'success' | 'failed'

interface OnrampConfig {
  projectId: string
  address: string
  partnerUserId: string
  defaultPaymentMethod?: 'APPLE_PAY' | 'CARD'
}

interface OnrampParams {
  amount: number
}

export function useCoinbaseOnramp({
  projectId,
  address,
  partnerUserId,
  defaultPaymentMethod = 'CARD',
}: OnrampConfig) {
  const [popup, setPopup] = useState<Window | null>(null)
  const [popupChecker, setPopupChecker] = useState<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    if (popup) {
      popup.close()
    }
    if (popupChecker) {
      clearInterval(popupChecker)
    }
    setPopup(null)
    setPopupChecker(null)
  }, [popup, popupChecker])

  const mutation = useMutation<void, Error, OnrampParams>({
    mutationFn: async ({ amount }) => {
      const onrampUrl = getOnrampBuyUrl({
        projectId,
        addresses: {
          '0xCF6D79F936f50B6a8257733047308664151B2510': ['base'],
        },
        partnerUserId,
        defaultPaymentMethod,
        assets: ['USDC'],
        presetFiatAmount: amount,
        fiatCurrency: 'USD',
        redirectUrl: `${window.location.origin}/deposit/success`,
      })

      cleanup()

      const newPopup = window.open(onrampUrl, 'Coinbase Onramp', 'width=600,height=800')

      if (!newPopup) {
        throw new Error('Popup was blocked. Please enable popups and try again.')
      }

      setPopup(newPopup)

      return new Promise<void>((resolve, reject) => {
        const checker = setInterval(() => {
          if (newPopup.closed) {
            clearInterval(checker)
            setPopup(null)
            reject(new Error('Transaction cancelled'))
          }
        }, 1000)
        setPopupChecker(checker)
      })
    },
    onError: (error) => {
      cleanup()
      return error instanceof Error ? error : new Error('Unknown error occurred')
    },
    onSettled: () => {
      cleanup()
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
    cleanup()
  }, [mutation, cleanup])

  // Map mutation status to our OnrampStatus type
  const status: OnrampStatus = mutation.isPending
    ? 'pending'
    : mutation.isError
      ? 'failed'
      : mutation.isSuccess
        ? 'success'
        : 'idle'

  return {
    openOnramp,
    closeOnramp,
    status,
    error: mutation.error as Error | null,
    isLoading: mutation.isPending,
  }
}
