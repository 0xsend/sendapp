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
    setError(null)
  }, [])

  const initializeOnramp = useCallback(
    (customAmount?: number) => {
      return new Promise<CBPayInstanceType>((resolve, reject) => {
        initOnRamp(
          {
            appId,
            widgetParameters: {
              addresses: { '0xCF6D79F936f50B6a8257733047308664151B2510': ['base'] },
              assets: ['USDC'],
              presetCryptoAmount: customAmount || amount || 10,
              defaultNetwork: 'base',
              defaultExperience: 'buy',
              partnerUserId: destinationAddress,
            },
            onSuccess: () => {
              console.log('Success called')
              setStatus('success')
              utils.coinbase.invalidate()
            },
            onExit: () => {
              console.log('Exit called')
              closeOnramp()
              setStatus('idle')
            },
            onEvent: (event) => {
              console.log('Coinbase event:', event)
              if (event.eventName === 'open' || event.eventName === 'transition_view') {
                console.log('Setting status to pending')
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
        console.log('Opening onramp with amount:', customAmount)
        if (instanceRef.current) {
          instanceRef.current.destroy()
        }

        const instance = await initializeOnramp(customAmount)
        console.log('Instance initialized, opening...')
        instance.open()
      } catch (err) {
        console.error('Failed to open onramp:', err)
        setStatus('idle')
      }
    },
    [initializeOnramp]
  )

  useEffect(() => {
    if (!destinationAddress || !appId) return

    initializeOnramp()

    return () => {
      closeOnramp()
    }
  }, [appId, destinationAddress, initializeOnramp, closeOnramp])

  return {
    openOnramp,
    closeOnramp,
    status,
    error,
    isLoading: createTransaction.isPending,
  }
}
