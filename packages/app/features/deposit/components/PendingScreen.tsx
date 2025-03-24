import { Spinner, Text, YStack } from '@my/ui'
import { useEffect, useState } from 'react'
import { useTokenActivityFeed } from 'app/features/home/utils/useTokenActivityFeed'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { useSendAccount } from 'app/utils/send-accounts'
import type { PgBytea } from '@my/supabase/database.types'
import { useRouter } from 'solito/router'
import { hexToBytea } from 'app/utils/hexToBytea'

const defaultMaxWaitTime = 60000 * 2 // Default to 1 minute
/**
 * PendingScreen component that displays while waiting for a transaction to be confirmed.
 * It polls for new USDC transactions and redirects to success page when a new transaction is detected.
 *
 * @param props - Component properties
 * @param props.onSuccess - Callback function when transaction is successful
 * @param props.onFailure - Callback function when transaction fails
 * @param props.maxWaitTime - Maximum time to wait in milliseconds (defaults to 60000ms = 1 minute)
 *
 * @businessLogic
 * - Polls for new USDC transactions every 5 seconds
 * - Times out after maxWaitTime (default 2 minute)
 * - Calls onSuccess callback if a new transaction is detected
 * - Calls onFailure callback if transaction times out
 */
export function PendingScreen({
  maxWaitTime = defaultMaxWaitTime,
  onFailure,
}: {
  maxWaitTime?: number
  onFailure: () => void
}) {
  const router = useRouter()
  const { data: sendAccount } = useSendAccount()
  const [elapsedTime, setElapsedTime] = useState(0)
  const [initialActivityCount, setInitialActivityCount] = useState<number | null>(null)
  // Query to check for new USDC transactions
  const { data: activityData } = useTokenActivityFeed({
    address: hexToBytea(usdcAddress[baseMainnet.id]),
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
      router.push('/deposit/success')
    }
  }, [activityData, initialActivityCount, sendAccount?.user_id, router.push])

  // Set up a timer to track elapsed time and handle timeout
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1000)
    }, 1000)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (onFailure) {
        onFailure()
      }
    }, maxWaitTime)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [maxWaitTime, onFailure])

  // Calculate remaining time
  const remainingTime = Math.max(0, Math.floor((maxWaitTime - elapsedTime) / 1000))

  return (
    <YStack space="$4" ai="center" jc="center" p="$4" f={1}>
      <Spinner size="large" color="$primary" />
      <Text ta="center" fow="bold" fos="$6">
        Transaction Pending
      </Text>
      <Text ta="center" fos="$4">
        Waiting for Coinbase to verify payment: {remainingTime} seconds before redirecting
      </Text>
    </YStack>
  )
}
