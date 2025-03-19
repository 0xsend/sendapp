import { YStack, Text, Button } from '@my/ui'

export function PaymentFailed({ onRamp }: { onRamp: (event: unknown) => void }) {
  return (
    <YStack ai="center" gap="$4" py="$8">
      <Text fontSize="$6" fontWeight="500" color="$red10" ta="center">
        Transaction Failed
      </Text>
      <Text color="$gray11" ta="center">
        Your payment could not be processed. Please try again.
      </Text>
      <Button variant="outlined" color="$color" size="$4" onPress={onRamp}>
        Try Again
      </Button>
    </YStack>
  )
}
