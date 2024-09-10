import { H4, XStack, YStack, type YStackProps } from '@my/ui'
import { DepositAddress } from 'app/components/DepositAddress'
import { useSendAccount } from 'app/utils/send-accounts'

/**
 * Deposit screen shows the various options for depositing funds.
 * - Web3 Wallet (window.ethereum)
 * - Coinbase Pay
 * - ???
 */
export function DepositScreen() {
  return <DepositWelcome />
}

export function DepositWelcome(props: YStackProps) {
  return (
    <YStack mt="$4" mx="auto" width={'100%'} $sm={{ maxWidth: 600 }} {...props}>
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
