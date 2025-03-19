import { useState, useCallback, useEffect, useRef } from 'react'
import { getOnrampBuyUrl } from '@coinbase/onchainkit/fund'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'solito/router'

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

export function useCoinbaseOnramp({
  projectId,
  address,
  partnerUserId,
  defaultPaymentMethod = 'CARD',
}: OnrampConfig) {
  const popupRef = useRef<Window | null>(null)
  const [popupChecker, setPopupChecker] = useState<NodeJS.Timeout | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const router = useRouter()

  const cleanup = useCallback(() => {
    if (popupRef.current) {
      popupRef.current.close()
      popupRef.current = null
    }
    if (popupChecker) {
      clearInterval(popupChecker)
      setPopupChecker(null)
    }
    setPaymentSubmitted(false)
  }, [popupChecker])

  const mutation = useMutation<void, Error, OnrampParams>({
    mutationFn: async ({ amount }) => {
      console.log('[Onramp] Starting transaction for:', amount, 'USD')

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
        redirectUrl: `${window.location.origin}/deposit/success/callback`,
      })

      cleanup()

      const newPopup = window.open(onrampUrl, 'Coinbase Onramp', 'width=600,height=800')

      if (!newPopup) {
        throw new Error('Popup was blocked. Please enable popups and try again.')
      }

      popupRef.current = newPopup

      return new Promise<void>((resolve, reject) => {
        const checker = setInterval(() => {
          if (!newPopup.closed) {
            return
          }
          console.log('[Onramp] Popup closed by user.')
          clearInterval(checker)
          popupRef.current = null
          // A user can close the tab and be in two states
          // where the payment was made or not made.
          if (!paymentSubmitted) {
            reject(new Error('Transaction cancelled'))
          } else {
            resolve()
          }
        }, 1000)
        setPopupChecker(checker)
      })
    },
    onError: (error) => {
      console.log('[Onramp] Transaction failed:', error.message)
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
        console.log('[Onramp] Transaction successful - processing completion')
        try {
          setIsSuccess(true)
          router.push('/deposit/success')
          cleanup()
          mutation.reset()
        } catch (error) {
          console.error('[Onramp] Navigation failed after success:', error)
          setIsSuccess(false)
          mutation.reset()
          cleanup()
        }
      } else if (event.data?.type === 'COINBASE_ONRAMP_PENDING') {
        setPaymentSubmitted(true)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [cleanup, router, mutation])

  const openOnramp = useCallback(
    (amount: number) => {
      setIsSuccess(false)
      setPaymentSubmitted(false)
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
      ? 'pending_payment'
      : paymentSubmitted
        ? 'payment_submitted'
        : mutation.isError
          ? 'failed'
          : 'idle'

  return {
    openOnramp,
    closeOnramp,
    status,
    error: mutation.error as Error | null,
    isLoading: mutation.isPending || isSuccess || paymentSubmitted,
    isRedirecting: isSuccess,
  }
}
