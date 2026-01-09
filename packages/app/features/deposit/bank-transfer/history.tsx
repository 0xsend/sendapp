import { FadeCard, Paragraph, ScrollView, Separator, Spinner, XStack, YStack } from '@my/ui'
import { useBridgeDeposits } from 'app/features/bank-transfer'
import { useMemo } from 'react'

function formatAmount(amount: number | null, currency: string | null) {
  const value = typeof amount === 'number' ? amount : 0
  const code = (currency ?? 'usd').toUpperCase()
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return code === 'USD' ? `$${formatted}` : `${formatted} ${code}`
}

function formatPaymentRail(rail?: string | null) {
  if (!rail) return 'Bank transfer'
  return rail === 'ach_push' ? 'ACH transfer' : 'Wire transfer'
}

function formatStatus(status?: string | null) {
  switch (status) {
    case 'awaiting_funds':
      return 'Awaiting funds'
    case 'funds_received':
      return 'Funds received'
    case 'funds_scheduled':
      return 'Funds scheduled'
    case 'in_review':
      return 'In review'
    case 'payment_submitted':
      return 'Payment submitted'
    case 'payment_processed':
      return 'Completed'
    case 'undeliverable':
      return 'Undeliverable'
    case 'returned':
      return 'Returned'
    case 'missing_return_policy':
      return 'Missing return policy'
    case 'refunded':
      return 'Refunded'
    case 'canceled':
      return 'Canceled'
    case 'error':
      return 'Error'
    case 'refund':
      return 'Refunded'
    default:
      return 'Processing'
  }
}

export function BankTransferHistoryScreen() {
  const { data: deposits, isLoading, error } = useBridgeDeposits()

  const rows = useMemo(() => deposits ?? [], [deposits])

  if (isLoading) {
    return (
      <YStack f={1} ai="center" jc="center" py="$8">
        <Spinner size="large" color="$primary" />
      </YStack>
    )
  }

  if (error) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <FadeCard>
          <Paragraph color="$error">Failed to load transfer history.</Paragraph>
        </FadeCard>
      </YStack>
    )
  }

  if (!rows.length) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <FadeCard>
          <Paragraph>No bank transfers yet.</Paragraph>
        </FadeCard>
      </YStack>
    )
  }

  return (
    <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <FadeCard>
          <YStack gap="$3">
            {rows.map((deposit, index) => {
              const title = formatAmount(deposit.amount, deposit.currency)
              const status = formatStatus(deposit.status)
              const rail = formatPaymentRail(deposit.payment_rail)
              const createdAt = new Date(deposit.created_at)
              const dateLabel = createdAt.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
              return (
                <YStack key={deposit.id} gap="$2">
                  <XStack jc="space-between" ai="center">
                    <Paragraph fontSize="$5" fontWeight={600}>
                      {title}
                    </Paragraph>
                    <Paragraph fontSize="$4" color="$lightGrayTextField">
                      {status}
                    </Paragraph>
                  </XStack>
                  <Paragraph fontSize="$3" color="$lightGrayTextField">
                    {rail} • {dateLabel}
                  </Paragraph>
                  {deposit.trace_number && (
                    <Paragraph fontSize="$3" color="$lightGrayTextField">
                      Trace: {deposit.trace_number}
                    </Paragraph>
                  )}
                  {index < rows.length - 1 && <Separator my="$2" />}
                </YStack>
              )
            })}
          </YStack>
        </FadeCard>
      </ScrollView>
    </YStack>
  )
}
