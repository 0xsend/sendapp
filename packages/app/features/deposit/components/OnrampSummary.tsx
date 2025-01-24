import { Dialog, Button, Text, XStack, YStack, Spinner } from '@my/ui'

interface QuoteResponse {
  payment_total: { value: string; currency: string }
  payment_subtotal: { value: string; currency: string }
  purchase_amount: { value: string; currency: string }
  network_fee: { value: string; currency: string }
  coinbase_fee: { value: string; currency: string }
  quote_id: string
}

interface OnrampSummaryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  onConfirm: () => void
  isLoading?: boolean
  quote?: QuoteResponse | null
  error?: string
}

export function OnrampSummary({
  open,
  onOpenChange,
  amount,
  onConfirm,
  isLoading,
  quote,
  error,
}: OnrampSummaryProps) {
  const renderPreview = () => {
    if (isLoading) {
      return (
        <YStack ai="center" py="$8">
          <Spinner size="large" color="$primary" />
        </YStack>
      )
    }

    if (error) {
      return (
        <YStack ai="center" py="$8">
          <Text color="$red10" ta="center">
            {error}
          </Text>
          <Text color="$gray11" ta="center" mt="$2">
            Please try again later
          </Text>
        </YStack>
      )
    }

    const totalFees = quote ? Number(quote.network_fee.value) + Number(quote.coinbase_fee.value) : 0

    return (
      <YStack py="$8" px="$4">
        <YStack gap="$6">
          <YStack ai="center" gap="$2">
            <Text fontSize="$9" fontWeight="500">
              ${amount.toFixed(2)}
            </Text>
            <Text color="$gray11">Amount to deposit</Text>
          </YStack>

          {quote && (
            <YStack gap="$4">
              <YStack gap="$3" py="$4" px="$4" backgroundColor="$backgroundHover" borderRadius="$4">
                <XStack jc="space-between">
                  <Text color="$gray11">You receive</Text>
                  <Text fontWeight="500">
                    {Number(quote.purchase_amount.value).toFixed(2)}{' '}
                    {quote.purchase_amount.currency}
                  </Text>
                </XStack>

                <XStack jc="space-between">
                  <Text color="$gray11">Fee</Text>
                  <Text fontWeight="500">${totalFees.toFixed(2)}</Text>
                </XStack>

                <XStack jc="space-between" borderTopWidth={1} borderColor="$gray6" pt="$3">
                  <Text fontWeight="500">Total</Text>
                  <Text fontWeight="600">
                    ${Number(quote.payment_total.value).toFixed(2)} {quote.payment_total.currency}
                  </Text>
                </XStack>
              </YStack>
            </YStack>
          )}
        </YStack>
      </YStack>
    )
  }

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          x={0}
          y={0}
          opacity={1}
          scale={1}
          width="90%"
          maxWidth={400}
          position="absolute"
          top="50%"
          left="50%"
          transform={[{ translateX: '-50%' }, { translateY: '-50%' }]}
          mx="auto"
          $gtSm={{
            width: 400,
          }}
          px="$4"
          overflow="hidden"
        >
          <Dialog.Title ta="center">Transaction Summary</Dialog.Title>
          {renderPreview()}
          <XStack
            gap="$3"
            jc="flex-end"
            $sm={{
              flexDirection: 'column',
              gap: '$2',
            }}
          >
            <Dialog.Close asChild>
              <Button
                variant="outlined"
                color="$color"
                $sm={{
                  width: '100%',
                }}
              >
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              backgroundColor="$primary"
              color="$color"
              onPress={onConfirm}
              disabled={isLoading}
              $sm={{
                width: '100%',
              }}
            >
              {isLoading ? 'Processing...' : 'Confirm Transaction'}
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
