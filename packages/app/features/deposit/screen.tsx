import { H4, XStack, YStack } from '@my/ui'
import { DepositAddress } from 'app/components/DepositAddress'
import { useSendAccount } from 'app/utils/send-accounts'

export function DepositScreen() {
  return (
    <YStack mt="$4" mx="auto" width={'100%'} $sm={{ maxWidth: 600 }}>
      <YStack w={'100%'}>
        <DepositAddressWrapper />
      </YStack>
    </YStack>
  )
}

function DepositAddressWrapper() {
  const { data: sendAccount } = useSendAccount()

  return (
    <XStack width={'100%'} ai="center" mt="$size.1">
      <H4 fontWeight={'400'}>Deposit on Base</H4>
      <DepositAddress address={sendAccount?.address} />
    </XStack>
  )
}
