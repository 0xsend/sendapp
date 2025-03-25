import { useState, useCallback, useEffect, useRef } from 'react'
import { getOnrampBuyUrl } from '@coinbase/onchainkit/fund'
import { useMutation } from '@tanstack/react-query'

type OnrampStatus = 'idle' | 'pending_payment' | 'success' | 'failed' | 'payment_submitted'

const COINBASE_PAY_ORIGIN = 'https://pay.coinbase.com'
const COINBASE_PAYMENT_SUBMITTED_PAGE_ROUTE = '/v2/guest/onramp/order-submitted'
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
  // Use a ref to track payment submission status that will be accessible in the Promise closure
  const paymentSubmittedRef = useRef(false)
  // Keep state for UI updates, but use the ref for the Promise logic
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const cleanup = useCallback(() => {
    if (popupRef.current) {
      popupRef.current.close()
      popupRef.current = null
    }
    if (popupChecker) {
      clearInterval(popupChecker)
      setPopupChecker(null)
    }
  }, [popupChecker])

  const mutation = useMutation<void, Error, OnrampParams>({
    mutationFn: async ({ amount }) => {
      console.log('[Onramp] Starting transaction for:', amount, 'USD')

      const onrampUrl = getOnrampBuyUrl({
        projectId,
        addresses: {
          '0x2A92Cf5727E575E8954b854aD480BA7bEf1EDaaA': ['base'],
          // [address]: ['base'],
        },
        partnerUserId,
        defaultPaymentMethod,
        assets: ['USDC'],
        presetFiatAmount: amount,
        fiatCurrency: 'USD',
      })

      cleanup()
      const newPopup = window.open(onrampUrl, 'Coinbase Onramp', 'width=600,height=800')

      if (!newPopup) {
        throw new Error('Popup was blocked. Please enable popups and try again.')
      }

      popupRef.current = newPopup

      return new Promise<void>((resolve, reject) => {
        const checker = setInterval(() => {
          console.log(paymentSubmittedRef.current)
          if (!newPopup.closed) {
            return
          }
          console.log('[Onramp] Popup closed by user.')
          clearInterval(checker)
          popupRef.current = null
          // A user can close the tab and be in two states
          // where the payment was made or not made.
          if (!paymentSubmittedRef.current) {
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
      if (event.origin !== COINBASE_PAY_ORIGIN) return
      const eventData = JSON.parse(event.data)
      if (eventData?.data?.eventName === 'success') {
        console.log('[Onramp] Transaction successful - processing completion')
        setIsSuccess(true)
        cleanup()
        mutation.reset()
      } else if (eventData?.data?.pageRoute === COINBASE_PAYMENT_SUBMITTED_PAGE_ROUTE) {
        console.log('[Onramp] Transaction pending - waiting for Coinbase approval')
        paymentSubmittedRef.current = true
        setPaymentSubmitted(true)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [cleanup, mutation])

  const openOnramp = useCallback(
    (amount: number) => {
      setIsSuccess(false)
      setPaymentSubmitted(false)
      paymentSubmittedRef.current = false
      mutation.mutate({ amount })
    },
    [mutation]
  )

  const closeOnramp = useCallback(() => {
    setIsSuccess(false)
    mutation.reset()
    cleanup()
  }, [mutation, cleanup])

  let status: OnrampStatus
  switch (true) {
    case isSuccess:
      status = 'success'
      break
    case mutation.isPending:
      status = 'pending_payment'
      break
    case paymentSubmitted:
      status = 'payment_submitted'
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
    isLoading: mutation.isPending || isSuccess || paymentSubmitted,
    isRedirecting: isSuccess,
  }
}
