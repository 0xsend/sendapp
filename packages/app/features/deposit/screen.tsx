import { YStack } from '@my/ui'
import { DepositOptionButton } from './components/DepositOptionButton'
import { IconApple, IconDebitCard, IconWallet } from 'app/components/icons'

export function DepositScreen() {
  return (
    <YStack
      width={'100%'}
      gap="$5"
      jc="flex-start"
      $gtLg={{
        width: '50%',
        pb: '$3.5',
      }}
    >
      <YStack
        width="100%"
        gap="$3.5"
        $gtLg={{
          gap: '$5',
        }}
      >
        <DepositOptionButton
          title="Crypto Wallet"
          description="Deposit from an external wallet"
          Icon={IconWallet}
          href={'/deposit/crypto'}
        />
        <DepositOptionButton
          title="Apple Pay"
          description="Debit card only"
          Icon={IconApple}
          href={'/deposit/apple-pay'}
        />
        <DepositOptionButton
          title="Debit Card"
          description="Quick deposits up to $500/week"
          Icon={IconDebitCard}
          href={'/deposit/debit-card'}
        />
      </YStack>
    </YStack>
  )
}
