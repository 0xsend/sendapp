import { useState, useCallback, useEffect } from 'react'
import { getOnrampBuyUrl } from '@coinbase/onchainkit/fund'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'solito/router'

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
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

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
        redirectUrl: `${window.location.origin}/deposit/callback`,
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

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data?.type === 'COINBASE_ONRAMP_SUCCESS') {
        try {
          setIsSuccess(true)
          await new Promise((resolve) => setTimeout(resolve, 3000))
          await router.push('/deposit/success')
          mutation.reset()
        } catch (error) {
          console.error('Navigation failed:', error)
          setIsSuccess(false)
          mutation.reset()
        } finally {
          cleanup()
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [cleanup, router, mutation])

  const openOnramp = useCallback(
    (amount: number) => {
      setIsSuccess(false)
      mutation.mutate({ amount })
    },
    [mutation]
  )

  const closeOnramp = useCallback(() => {
    setIsSuccess(false)
    mutation.reset()
    cleanup()
  }, [mutation, cleanup])

  const status: OnrampStatus = isSuccess
    ? 'success'
    : mutation.isPending
      ? 'pending'
      : mutation.isError
        ? 'failed'
        : 'idle'

  return {
    openOnramp,
    closeOnramp,
    status,
    error: mutation.error as Error | null,
    isLoading: mutation.isPending || isSuccess,
    isRedirecting: isSuccess,
  }
}
