import { useMemo } from 'react'
import { Shimmer, YStack } from '@my/ui'
import { DepositOptionButton } from './components/DepositOptionButton'
import { IconApple, IconDebitCard, IconWallet, IconDollar } from 'app/components/icons'
import { useTranslation } from 'react-i18next'
import { useBankTransferEnabled } from 'app/utils/useFeatureFlag'
import { Platform } from 'react-native'
import { useBridgeGeoBlock, useKycStatus } from 'app/features/bank-transfer'

export function DepositScreen() {
  const { t } = useTranslation('deposit')
  const isBankTransferEnabled = useBankTransferEnabled()
  const { isApproved } = useKycStatus()
  const { data: isGeoBlocked, isLoading: isGeoBlockLoading } = useBridgeGeoBlock()
  const geoblockEnabled =
    process.env.NEXT_PUBLIC_GEOBLOCK_BANK_TRANSFER ?? process.env.NEXT_PUBLIC_GEOBLOCK
  const isNative = Platform.OS !== 'web'
  const shouldShowBankTransfer =
    isBankTransferEnabled && (!isNative || isApproved) && !isGeoBlocked && !isGeoBlockLoading
  type DepositOption = Parameters<typeof DepositOptionButton>[0]

  const options = useMemo<DepositOption[]>(() => {
    const base: DepositOption[] = [
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
      {
        Icon: IconWallet,
        href: '/deposit/crypto',
        title: t('options.crypto.title'),
        description: t('options.crypto.description'),
      },
    ]

    if (shouldShowBankTransfer) {
      base.unshift({
        Icon: IconDollar,
        href: '/deposit/bank-transfer',
        title: t('options.bankTransfer.title', 'Bank Transfer'),
        description: t('options.bankTransfer.description', 'Deposit via ACH or wire transfer'),
      })
    }

    return base
  }, [t, shouldShowBankTransfer])

  if (geoblockEnabled && isGeoBlockLoading) {
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
          <DepositOptionsSkeleton />
        </YStack>
      </YStack>
    )
  }

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

const SKELETON_IDS = ['sk-1', 'sk-2', 'sk-3', 'sk-4'] as const

function DepositOptionsSkeleton() {
  return (
    <YStack width="100%" gap="$3.5" $gtLg={{ gap: '$5' }}>
      {SKELETON_IDS.map((id) => (
        <YStack
          key={id}
          ai="center"
          jc="space-between"
          fd="row"
          px="$4"
          py="$3.5"
          br="$6"
          borderWidth={1}
          borderColor="$borderColor"
          $theme-light={{ borderColor: '$borderColor' }}
        >
          <YStack fd="row" ai="center" gap="$4" f={1}>
            <Shimmer w={28} h={28} br={8} />
            <YStack f={1} gap="$2">
              <Shimmer w="55%" h={18} br="$2" />
              <Shimmer w="80%" h={14} br="$2" />
            </YStack>
          </YStack>
          <Shimmer w={16} h={16} br={100} />
        </YStack>
      ))}
    </YStack>
  )
}
