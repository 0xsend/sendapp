import { Paragraph, YStack } from '@my/ui'
import { DepositOptionButton } from './components/DepositOptionButton'
import { IconApple, IconDebitCard, IconWallet } from 'app/components/icons'

export function DepositScreen() {
  return (
    <YStack
      width={'100%'}
      gap="$5"
      jc={'space-between'}
      $gtLg={{
        width: '50%',
        jc: 'flex-start',
        pb: '$3.5',
      }}
    >
      <YStack gap={'$2'}>
        <Paragraph size={'$9'} fontWeight={500}>
          Deposit Funds
        </Paragraph>
        <Paragraph
          fontSize={'$5'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Select a deposit method
        </Paragraph>
      </YStack>
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
