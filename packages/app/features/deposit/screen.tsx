import { YStack } from '@my/ui'
import { DepositOptionButton } from './components/DepositOptionButton'
import { useRouter } from 'next/router'

export function DepositScreen() {
  const router = useRouter()

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

            <DepositOptionButton
              option="apple"
              selectedOption={null}
              onPress={() => router.push('/deposit/apple-pay')}
              title="Apple Pay"
              description="Debit card only"
            />

            <DepositOptionButton
              option="card"
              selectedOption={null}
              onPress={() => router.push('/deposit/debit-card')}
              title="Debit Card"
              description="Up to $500 per week"
            />
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  )
}
