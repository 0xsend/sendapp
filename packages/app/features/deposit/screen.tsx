import { YStack } from '@my/ui'
import { DepositOptionButton } from './components/DepositOptionButton'
import { useRouter } from 'next/router'
import { useSendAccount } from 'app/utils/send-accounts'

const ONRAMP_ENABLED_USERS = (process.env.NEXT_PUBLIC_ONRAMP_ALLOWLIST ?? '').split(',')

export function DepositScreen() {
  const router = useRouter()
  const { data: sendAccount } = useSendAccount()
  const isOnrampEnabled =
    !ONRAMP_ENABLED_USERS ||
    (sendAccount?.user_id && ONRAMP_ENABLED_USERS.includes(sendAccount.user_id))

  return (
    <YStack mt="$4" mx="auto" width={'100%'} $sm={{ maxWidth: 600 }}>
      <YStack w={'100%'}>
        <YStack f={1} px="$4" jc="space-between" pb="$4">
          <YStack gap="$3" width="100%">
            <DepositOptionButton
              option="crypto"
              selectedOption={null}
              onPress={() => router.push('/deposit/crypto')}
              title="Via Crypto"
              description="Direct deposit via External Wallet"
            />

            {isOnrampEnabled && (
              <DepositOptionButton
                option="card"
                selectedOption={null}
                onPress={() => router.push('/deposit/debit-card')}
                title="Debit Card"
                description="Up to $500 per week"
              />
            )}
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  )
}
