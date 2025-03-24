import { Spinner, Text, YStack } from '@my/ui'
import { useSendAccount } from 'app/utils/send-accounts'
import { useEffect } from 'react'
import { fetchOnrampTransactionStatus } from '@coinbase/onchainkit/fund'

const CHECK_INTERVAL_MS = 5000
export function CoinbaseOnrampVerifyScreen({
  onFailure,
  onSuccess,
}: {
  onFailure: () => void
  onSuccess: () => void
}) {
  const { data: sendAccount } = useSendAccount()

  useEffect(() => {
    const checkTransactionStatus = async () => {
      if (!sendAccount?.user_id) {
        console.log('[COINBASE_VERIFY_SCREEN] No Send Account Found')
        onFailure()
        return
      }
      try {
        const transactions = await fetchOnrampTransactionStatus({
          partnerUserId: sendAccount.user_id,
          nextPageKey: '',
          pageSize: '1',
        })

        if (!transactions || !transactions.transactions) {
          console.log('[COINBASE_VERIFY_SCREEN] No CB Transactions found')
          onFailure()
          return
        }
        const latestTxStatus = transactions.transactions[0]?.status
        console.log('[COINBASE_VERIFY_SCREEN] Transaction status:', latestTxStatus)
        if (latestTxStatus === 'ONRAMP_TRANSACTION_STATUS_SUCCESS') {
          console.log('[COINBASE_VERIFY_SCREEN] Successful transaction')
          onSuccess()
        } else if (latestTxStatus === 'ONRAMP_TRANSACTION_STATUS_FAILED') {
          console.log('[COINBASE_VERIFY_SCREEN] Failed transaction')
          onFailure()
        } else {
          console.log(
            `COINBASE_VERIFY_SCREEN] Checking transactions again in ${CHECK_INTERVAL_MS} ms`
          )
          setTimeout(checkTransactionStatus, CHECK_INTERVAL_MS)
        }
      } catch (err) {
        console.error('Error checking transaction status:', err)
        onFailure()
      }
    }
    checkTransactionStatus()
  }, [sendAccount, onSuccess, onFailure])

  return (
    <YStack space="$4" ai="center" jc="center" p="$4" f={1}>
      <Spinner size="large" color="$primary" />
      <Text ta="center" fow="bold" fos="$6">
        Transaction Pending
      </Text>
      <Text ta="center" fos="$4">
        Coinbase is currently verifying your payment. This page will automatically redirect once
        ready.
      </Text>
    </YStack>
  )
}
