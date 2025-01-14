import { Text, YStack, XStack, Spinner } from '@my/ui'

export interface QuoteResponse {
  payment_total: { value: string; currency: string }
  payment_subtotal: { value: string; currency: string }
  purchase_amount: { value: string; currency: string }
  network_fee: { value: string; currency: string }
  coinbase_fee: { value: string; currency: string }
  quote_id: string
}

interface OnrampPreviewProps {
  address: string
  quote: QuoteResponse | null
  isLoading?: boolean
}

export function OnrampPreview({ quote, isLoading }: OnrampPreviewProps) {
  if (isLoading) {
    return (
      <YStack ai="center" py="$4">
        <Spinner size="large" color="$primary" />
      </YStack>
    )
  }

  if (!quote || !quote.payment_total) return null

  return (
    <YStack space="$4" py="$4">
      <XStack jc="space-between">
        <Text color="$gray11">You pay</Text>
        <Text fontWeight="500">
          ${Number(quote.payment_total.value).toFixed(2)} {quote.payment_total.currency}
        </Text>
      </XStack>

      <XStack jc="space-between">
        <Text color="$gray11">You receive</Text>
        <Text fontWeight="500">
          {Number(quote.purchase_amount.value).toFixed(2)} {quote.purchase_amount.currency}
        </Text>
      </XStack>

      <XStack jc="space-between">
        <Text color="$gray11">Fees</Text>
        <Text fontWeight="500">
          ${(Number(quote.network_fee.value) + Number(quote.coinbase_fee.value)).toFixed(2)}
        </Text>
      </XStack>
    </YStack>
  )
}
