import { Spinner, Text, YStack } from '@my/ui'
import { useEffect, useState } from 'react'
import { useTokenActivityFeed } from 'app/features/home/utils/useTokenActivityFeed'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { useSendAccount } from 'app/utils/send-accounts'
import type { PgBytea } from '@my/supabase/database.types'

/**
 * PaymentSubmitted component that displays while waiting for a transaction to be confirmed.
 * It polls for new USDC transactions and redirects to success page when a new transaction is detected.
 *
 * This page needed for whenever users leaves the Coinbase Page after submitting a payment. We no longer
 * receive events from Coinbase when the page is closed, so we must use our own signals (i.e transactions)
 * to determine if Coinbase processes the payment for USDC.
 *
 * @param props - Component properties
 * @param props.onSuccess - Callback function when transaction is successful
 * @param props.onError - Callback function when transaction fails
 * @param props.maxWaitTime - Maximum time to wait in milliseconds (defaults to 60000ms = 1 minute)
 *
 * @businessLogic
 * - Polls for new USDC transactions every 5 seconds
 * - Times out after maxWaitTime (default 1 minute)
 * - Redirects to success page if a new transaction is detected
 * - Redirects to error page if transaction times out
 */
export function PaymentSubmitted({
  maxWaitTime = 60000, // Default to 1 minute
}: {
  maxWaitTime?: number
}) {
  const { data: sendAccount } = useSendAccount()
  const [initialActivityCount, setInitialActivityCount] = useState<number | null>(null)
  // Query to check for new USDC transactions
  const { data: activityData } = useTokenActivityFeed({
    address: usdcAddress[baseMainnet.id] as PgBytea,
    refetchInterval: 5000, // Poll every 5 seconds
    enabled: !!sendAccount?.address,
    pageSize: 1,
  })

  // Initialize the initial activity count
  useEffect(() => {
    if (activityData && initialActivityCount === null) {
      const count = activityData.pages[0]?.length || 0
      setInitialActivityCount(count)
    }
  }, [activityData, initialActivityCount])

  // Check for new transactions
  useEffect(() => {
    if (!activityData || initialActivityCount === null) return

    const usdcToMe = activityData.pages[0]?.filter(
      (s) => s.to_user?.send_id === sendAccount?.user_id
    )
    const currentCount = usdcToMe?.length || 0

    // If we have new transactions, consider it a success
    if (currentCount > initialActivityCount) {
      // TODO: redirect to success page
    }
  }, [activityData, initialActivityCount, sendAccount?.user_id])

  // Set up a timer to track coinbase timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      // TODO: Redirect to failure
    }, maxWaitTime)

    return () => {
      clearTimeout(timeout)
    }
  }, [maxWaitTime])

  return (
    <YStack ai="center" gap="$4" py="$8">
      <Spinner size="large" color="$primary" />
      <Text fontSize="$6" fontWeight="500" ta="center">
        Payment currently being verified by Coinbase.
      </Text>
      <Text color="$gray11" ta="center">
        Finishing up...
      </Text>
    </YStack>
  )
}
