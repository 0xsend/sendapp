import { useRef, useState, useEffect } from 'react'
import { type CBPayInstanceType, initOnRamp } from '@coinbase/cbpay-js'
import { useMutation } from '@tanstack/react-query'

type OnrampStatus = 'idle' | 'pending' | 'success' | 'failed'

export function useCoinbaseOnramp(appId: string, destinationAddress: string, amount?: number) {
  const instanceRef = useRef<CBPayInstanceType | null>(null)
  const [widgetStatus, setWidgetStatus] = useState<OnrampStatus>('idle')

  const cleanupInstance = () => {
    if (instanceRef.current) {
      instanceRef.current.destroy()
      instanceRef.current = null
    }
    setWidgetStatus('idle')
  }

  useEffect(() => {
    return () => cleanupInstance()
  }, [cleanupInstance])

  const mutation = useMutation({
    mutationKey: ['coinbase-onramp', destinationAddress],
    mutationFn: async (customAmount: number) => {
      if (!destinationAddress) {
        throw new Error('Destination address is required')
      }

      cleanupInstance()

      return new Promise<void>((resolve, reject) => {
        const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent)

        initOnRamp(
          {
            appId,
            widgetParameters: {
              // Hardcoded address for testing
              addresses: { '0xCF6D79F936f50B6a8257733047308664151B2510': ['base'] },
              assets: ['USDC'],
              presetCryptoAmount: customAmount || amount || 10,
              defaultNetwork: 'base',
              defaultExperience: 'buy',
              defaultPaymentMethod: isIOS ? 'APPLE_PAY' : 'CARD',
              partnerUserId: destinationAddress,
            },
            onSuccess: () => {
              setWidgetStatus('success')
              resolve()
            },
            onExit: () => {
              cleanupInstance()
              mutation.reset()
            },
            onEvent: (event) => {
              if (event.eventName === 'open' || event.eventName === 'transition_view') {
                setWidgetStatus('pending')
              }
              if (event.eventName === 'error') {
                setWidgetStatus('failed')
                reject(new Error('Transaction failed'))
              }
            },
            experienceLoggedIn: 'popup',
            experienceLoggedOut: 'popup',
          },
          (initError, instance) => {
            if (initError || !instance) {
              setWidgetStatus('failed')
              reject(initError || new Error('Failed to initialize Coinbase Onramp'))
              return
            }
            instanceRef.current = instance
            instance.open()
          }
        )
      })
    },
  })

  const closeOnramp = () => {
    cleanupInstance()
    mutation.reset()
  }

  const status: OnrampStatus =
    widgetStatus === 'idle'
      ? (() => {
          if (mutation.isPending) return 'pending'
          if (mutation.isSuccess) return 'success'
          if (mutation.isError) return 'failed'
          return 'idle'
        })()
      : widgetStatus

  return {
    openOnramp: mutation.mutate,
    closeOnramp,
    status,
    error: mutation.error,
    isLoading: mutation.isPending || widgetStatus === 'pending',
  }
}
