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

  const handleSuccess = useCallback(() => {
    setStatus('success')
    utils.coinbase.invalidate()
  }, [utils.coinbase])

  const handleExit = useCallback(() => {
    setStatus('idle')
    console.log('handleExit')
  }, [])

  useEffect(() => {
    if (!destinationAddress || !appId) {
      return undefined
    }

    try {
      initOnRamp(
        {
          appId,
          widgetParameters: {
            addresses: { '0xCF6D79F936f50B6a8257733047308664151B2510': ['base'] },
            assets: ['USDC'],
            presetCryptoAmount: amount || 10,
            defaultNetwork: 'base',
            defaultExperience: 'buy',
            partnerUserId: destinationAddress,
          },
          onSuccess: handleSuccess,
          onExit: handleExit,
          onEvent: (event) => {
            console.log('Coinbase event:', event)
          },
          experienceLoggedIn: 'popup',
          experienceLoggedOut: 'popup',
        },
        (initError, instance) => {
          if (initError || !instance) {
            setError(initError || new Error('Failed to initialize Coinbase Onramp'))
            return
          }
          instanceRef.current = instance
        }
      )

      return () => {
        if (instanceRef.current) {
          instanceRef.current.destroy()
          instanceRef.current = null
          setError(null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unexpected initialization error'))
      return undefined
    }
  }, [appId, destinationAddress, amount, handleSuccess, handleExit])

  const openOnramp = useCallback(
    (amount: number) => {
      if (!instanceRef.current) return

      if (amount) {
        instanceRef.current.destroy()
        initOnRamp(
          {
            appId,
            widgetParameters: {
              addresses: { '0xCF6D79F936f50B6a8257733047308664151B2510': ['base'] },
              assets: ['USDC'],
              presetCryptoAmount: amount,
              defaultNetwork: 'base',
              defaultExperience: 'buy',
              partnerUserId: destinationAddress,
            },
            onSuccess: handleSuccess,
            onExit: handleExit,
            onEvent: (event) => {
              console.log('Coinbase event:', event)
            },
            experienceLoggedIn: 'popup',
            experienceLoggedOut: 'popup',
          },
          (initError, instance) => {
            if (initError || !instance) {
              setError(initError || new Error('Failed to initialize Coinbase Onramp'))
              return
            }
            instanceRef.current = instance
            setStatus('pending')
            instance.open()
          }
        )
      } else {
        setStatus('pending')
        instanceRef.current.open()
      }
    },
    [appId, destinationAddress, handleSuccess, handleExit]
  )

  const closeOnramp = useCallback(() => {
    if (!instanceRef.current) return
    setStatus('idle')
    instanceRef.current.destroy()
    instanceRef.current = null
  }, [])

  return {
    openOnramp,
    closeOnramp,
    status,
    error,
    isLoading: createTransaction.isPending,
  }
}
