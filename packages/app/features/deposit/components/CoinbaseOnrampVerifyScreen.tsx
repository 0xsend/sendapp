import { Spinner, Text, YStack, Card, XStack, Button } from '@my/ui'
import { useSendAccount } from 'app/utils/send-accounts'
import { useEffect } from 'react'
import { fetchOnrampTransactionStatus } from '@coinbase/onchainkit/fund'
import debug from 'debug'

const log = debug('app:features:deposit:components:CoinbaseOnrampVerifyScreen')
const CHECK_INTERVAL_MS = 5000
const MAX_TIMEOUT_MS = 180000 // 3 minutes

export function CoinbaseOnrampVerifyScreen({
  onFailure,
  onSuccess,
}: {
  onFailure: () => void
  onSuccess: () => void
}) {
  const { data: sendAccount } = useSendAccount()

  useEffect(() => {
    // Set a timer that will trigger onFailure after MAX_TIMEOUT_MS
    const maxTimer = setTimeout(() => {
      log('Transaction timed out after 3 minutes')
      onFailure()
    }, MAX_TIMEOUT_MS)

    const checkTransactionStatus = async () => {
      if (!sendAccount?.user_id) {
        log('No Send Account Found')
        clearTimeout(maxTimer)
        onFailure()
        return
      }
      try {
        const transactions = await fetchOnrampTransactionStatus({
          partnerUserId: sendAccount.user_id,
          nextPageKey: '',
          pageSize: '1',
        })

        if (!transactions || !transactions.transactions || transactions.transactions.length === 0) {
          log('No CB Transactions found, trying again..')
          return
        }

        const latestTxStatus = transactions.transactions[0]?.status
        log('Transaction status:', latestTxStatus)
        if (latestTxStatus === 'ONRAMP_TRANSACTION_STATUS_SUCCESS') {
          log('Successful transaction')
          clearTimeout(maxTimer)
          onSuccess()
        } else if (latestTxStatus === 'ONRAMP_TRANSACTION_STATUS_FAILED') {
          log('Failed transaction')
          clearTimeout(maxTimer)
          onFailure()
        } else {
          log(`Checking transactions again in ${CHECK_INTERVAL_MS} ms`)
          setTimeout(checkTransactionStatus, CHECK_INTERVAL_MS)
        }
      } catch (err) {
        log('Error checking transaction status:', err)
        clearTimeout(maxTimer)
        onFailure()
      }
    }
    checkTransactionStatus()

    // Cleanup timer when component unmounts.
    return () => {
      clearTimeout(maxTimer)
    }
  }, [sendAccount, onSuccess, onFailure])

  return (
    <YStack width="100%" $gtSm={{ width: 600 }} gap="$4">
      <Card bc="$color1" width="100%" p="$6">
        <YStack ai="center" gap="$4">
          <Spinner size="large" color="$primary" />
          <Text fontSize="$8" fontWeight="600" ta="center">
            Transaction Pending
          </Text>
          <Text color="$gray11" ta="center">
            Coinbase is verifying your payment. This page will redirect when complete.
          </Text>
        </YStack>
      </Card>
    </YStack>
  )
}
