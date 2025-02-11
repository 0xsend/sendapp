import { useSendAccount } from 'app/utils/send-accounts'
import { DepositAddress } from 'app/features/deposit/components/DepositAddress'
import { YStack } from '@my/ui'

export function DepositCryptoScreen() {
  const { data: sendAccount } = useSendAccount()

  return (
    <YStack width="100%" ai="center">
      <DepositAddress address={sendAccount?.address} />
    </YStack>
  )
}
