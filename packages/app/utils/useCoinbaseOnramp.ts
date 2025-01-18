import { api } from 'app/utils/api'

interface OnrampParams {
  quoteId?: string
  defaultAsset?: string
  defaultPaymentMethod?: string
  fiatCurrency?: string
  presetFiatAmount?: number
}

export function useCoinbaseOnramp() {
  const getOnrampUrl = api.coinbase.getOnrampUrl.useMutation()
  const getQuote = api.coinbase.getQuote.useMutation()

  const openOnramp = (address: string, params?: OnrampParams) => {
    getOnrampUrl.mutate(
      {
        address,
        blockchains: ['base'],
        ...params,
      },
      {
        onSuccess: ({ url }) => {
          window.open(url, '_blank')
        },
      }
    )
  }

  return {
    openOnramp,
    isLoading: getOnrampUrl.isPending || getQuote.isPending,
    error: getOnrampUrl.error?.message || getQuote.error?.message || null,
    getQuote,
  }
}
