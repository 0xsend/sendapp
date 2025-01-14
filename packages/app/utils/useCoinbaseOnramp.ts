import { api } from 'app/utils/api'
import { useState } from 'react'

interface OnrampParams {
  quoteId?: string
  defaultAsset?: string
  defaultPaymentMethod?: string
  fiatCurrency?: string
  presetFiatAmount?: number
}

export function useCoinbaseOnramp() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getOnrampUrl = api.coinbase.getOnrampUrl.useMutation()
  const getQuote = api.coinbase.getQuote.useMutation()

  const openOnramp = async (address: string, params?: OnrampParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const { url } = await getOnrampUrl.mutateAsync({
        address,
        blockchains: ['base'],
        ...params,
      })

      window.open(url, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open Coinbase Onramp')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    openOnramp,
    isLoading,
    error,
    getQuote,
  }
}
