import { Spinner, Text, YStack } from '@my/ui'
import { useSendAccount } from 'app/utils/send-accounts'
import { useEffect } from 'react'
import { fetchOnrampTransactionStatus } from '@coinbase/onchainkit/fund'

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
      console.log('[COINBASE_VERIFY_SCREEN] Transaction timed out after 3 minutes')
      onFailure()
    }, MAX_TIMEOUT_MS)

    const checkTransactionStatus = async () => {
      if (!sendAccount?.user_id) {
        console.log('[COINBASE_VERIFY_SCREEN] No Send Account Found')
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
          console.log('[COINBASE_VERIFY_SCREEN] No CB Transactions found, trying again..')
          return
        }

        const latestTxStatus = transactions.transactions[0]?.status
        console.log('[COINBASE_VERIFY_SCREEN] Transaction status:', latestTxStatus)
        if (latestTxStatus === 'ONRAMP_TRANSACTION_STATUS_SUCCESS') {
          console.log('[COINBASE_VERIFY_SCREEN] Successful transaction')
          clearTimeout(maxTimer)
          onSuccess()
        } else if (latestTxStatus === 'ONRAMP_TRANSACTION_STATUS_FAILED') {
          console.log('[COINBASE_VERIFY_SCREEN] Failed transaction')
          clearTimeout(maxTimer)
          onFailure()
        } else {
          console.log(
            `[COINBASE_VERIFY_SCREEN] Checking transactions again in ${CHECK_INTERVAL_MS} ms`
          )
          setTimeout(checkTransactionStatus, CHECK_INTERVAL_MS)
        }
      } catch (err) {
        console.error('Error checking transaction status:', err)
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
    <YStack space="$4" ai="center" jc="center" p="$4" f={1}>
      <Spinner size="large" color="$primary" />
      <Text ta="center" fow="bold" fos="$6">
        Transaction Pending
      </Text>
      <Text ta="center" fos="$4">
        Coinbase is verifying your payment. This page will automatically redirect once ready.
      </Text>
    </YStack>
  )
}
