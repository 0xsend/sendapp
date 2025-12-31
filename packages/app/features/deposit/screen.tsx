import { useMemo } from 'react'
import { YStack } from '@my/ui'
import { DepositOptionButton } from './components/DepositOptionButton'
import { IconApple, IconDebitCard, IconWallet, IconDollar } from 'app/components/icons'
import { useTranslation } from 'react-i18next'

export function DepositScreen() {
  const { t } = useTranslation('deposit')

  const options = useMemo(
    () => [
      {
        Icon: IconWallet,
        href: '/deposit/crypto',
        title: t('options.crypto.title'),
        description: t('options.crypto.description'),
      },
      {
        Icon: IconDollar,
        href: '/deposit/bank-transfer',
        title: t('options.bankTransfer.title', 'Bank Transfer'),
        description: t('options.bankTransfer.description', 'Deposit via ACH or wire transfer'),
      },
      {
        Icon: IconApple,
        href: '/deposit/apple-pay',
        title: t('options.applePay.title'),
        description: t('options.applePay.description'),
      },
      {
        Icon: IconDebitCard,
        href: '/deposit/debit-card',
        title: t('options.debitCard.title'),
        description: t('options.debitCard.description'),
      },
    ],
    [t]
  )

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
        {options.map((option) => (
          <DepositOptionButton key={option.href} {...option} />
        ))}
      </YStack>
    </YStack>
  )
}
