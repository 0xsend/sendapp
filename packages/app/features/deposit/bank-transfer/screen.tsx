import { YStack, Paragraph, Spinner } from '@my/ui'
import { useCallback, useEffect, useState } from 'react'
import { Linking } from 'react-native'
import { BankDetailsCard, BankDetailsCardSkeleton } from './BankDetailsCard'
import { KycStatusCard } from './KycStatusCard'
import {
  useKycStatus,
  useInitiateKyc,
  useBankAccountDetails,
  useCreateVirtualAccount,
} from 'app/features/bank-transfer'
import { useSendAccount } from 'app/utils/send-accounts'

export function BankTransferScreen() {
  const { data: sendAccount } = useSendAccount()
  const { kycStatus, isApproved, isLoading: kycLoading } = useKycStatus()
  const { hasVirtualAccount, bankDetails, isLoading: vaLoading } = useBankAccountDetails()
  const initiateKyc = useInitiateKyc()
  const createVirtualAccount = useCreateVirtualAccount()
  const [kycUrl, setKycUrl] = useState<string | null>(null)

  const handleStartKyc = useCallback(async () => {
    try {
      const result = await initiateKyc.mutateAsync({})
      // Open KYC link in browser (platform-safe)
      if (result.kycLink) {
        await Linking.openURL(result.kycLink)
        setKycUrl(result.kycLink)
      }
    } catch (error) {
      console.error('Failed to initiate KYC:', error)
    }
  }, [initiateKyc])

  // Auto-create virtual account once approved (hide this from user)
  useEffect(() => {
    if (isApproved && !hasVirtualAccount && !vaLoading && sendAccount?.address) {
      createVirtualAccount.mutate(sendAccount.address)
    }
  }, [isApproved, hasVirtualAccount, vaLoading, sendAccount?.address, createVirtualAccount])

  // Loading state
  if (kycLoading) {
    return (
      <YStack f={1} ai="center" jc="center" py="$8">
        <Spinner size="large" color="$primary" />
      </YStack>
    )
  }

  // Not approved - show KYC status
  if (!isApproved) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <KycStatusCard
          kycStatus={kycStatus}
          onStartKyc={handleStartKyc}
          isLoading={initiateKyc.isPending}
        />

        {kycUrl && (
          <Paragraph fontSize="$3" color="$lightGrayTextField" ta="center">
            Verification window opened. Complete the process and return here.
          </Paragraph>
        )}
      </YStack>
    )
  }

  // Approved but setting up deposit account (auto-creating in background)
  if (!hasVirtualAccount) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <YStack ai="center" jc="center" py="$8" gap="$4">
          <Spinner size="large" color="$primary" />
          <Paragraph fontSize="$5" ta="center" color="$lightGrayTextField">
            Setting up your deposit account...
          </Paragraph>
        </YStack>
      </YStack>
    )
  }

  // Has virtual account - show bank details
  if (vaLoading || !bankDetails) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <BankDetailsCardSkeleton />
      </YStack>
    )
  }

  return (
    <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
      <YStack gap="$2">
        <Paragraph fontSize="$6" fontWeight={600}>
          Deposit from Your Bank
        </Paragraph>
        <Paragraph fontSize="$4" color="$lightGrayTextField">
          Transfer USD from your bank to the account below. Funds will appear in your Send wallet
          automatically.
        </Paragraph>
      </YStack>

      <BankDetailsCard
        bankName={bankDetails.bankName}
        routingNumber={bankDetails.routingNumber}
        accountNumber={bankDetails.accountNumber}
        beneficiaryName={bankDetails.beneficiaryName}
        paymentRails={bankDetails.paymentRails}
      />

      <Paragraph fontSize="$3" color="$lightGrayTextField" ta="center">
        ACH transfers typically arrive within 1-3 business days. Wire transfers are usually
        same-day.
      </Paragraph>
    </YStack>
  )
}
