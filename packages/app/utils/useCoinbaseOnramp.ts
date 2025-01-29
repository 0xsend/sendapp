import { useEffect, useState, useCallback, useRef } from 'react'
import { type CBPayInstanceType, initOnRamp } from '@coinbase/cbpay-js'
import { api } from 'app/utils/api'

export function useCoinbaseOnramp(appId: string, destinationAddress: string, amount?: number) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success'>('idle')
  const [error, setError] = useState<Error | null>(null)
  const utils = api.useUtils()
  const instanceRef = useRef<CBPayInstanceType | null>(null)

  const createTransaction = api.coinbase.createTransaction.useMutation({
    onSuccess: () => {
      utils.coinbase.invalidate()
    },
  })

  const closeOnramp = useCallback(() => {
    if (instanceRef.current) {
      instanceRef.current.destroy()
      instanceRef.current = null
    }
    setStatus('idle')
    setError(null)
  }, [])

  const initializeOnramp = useCallback(
    (customAmount?: number) => {
      return new Promise<CBPayInstanceType>((resolve, reject) => {
        if (!destinationAddress) {
          const error = new Error('Destination address is required')
          setError(error)
          reject(error)
          return
        }

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
              setStatus('success')
              utils.coinbase.invalidate()
            },
            onExit: () => {
              closeOnramp()
            },
            onEvent: (event) => {
              if (event.eventName === 'open' || event.eventName === 'transition_view') {
                setStatus('pending')
              }
            },
            experienceLoggedIn: 'popup',
            experienceLoggedOut: 'popup',
          },
          (initError, instance) => {
            if (initError || !instance) {
              const error = initError || new Error('Failed to initialize Coinbase Onramp')
              setError(error)
              setStatus('idle')
              reject(error)
              return
            }
            instanceRef.current = instance
            resolve(instance)
          }
        )
      })
    },
    [appId, destinationAddress, amount, utils.coinbase, closeOnramp]
  )

  const openOnramp = useCallback(
    async (customAmount: number) => {
      try {
        setStatus('pending')
        if (instanceRef.current) {
          instanceRef.current.destroy()
        }

        const instance = await initializeOnramp(customAmount)
        instance.open()
      } catch (err) {
        setStatus('idle')
      }
    },
    [initializeOnramp]
  )

  useEffect(() => {
    return () => {
      closeOnramp()
    }
  }, [closeOnramp])

  return {
    openOnramp,
    closeOnramp,
    status,
    error,
    isLoading: createTransaction.isPending,
  }
}
