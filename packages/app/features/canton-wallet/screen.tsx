import { YStack } from '@my/ui'
import { CantonWalletVerification } from './components/CantonWalletVerification'

export function CantonWalletScreen() {
  return (
    <YStack w={'100%'} gap="$5" pb={'$3.5'} mt={'$3'} $gtLg={{ width: '50%' }}>
      <CantonWalletVerification />
    </YStack>
  )
}
