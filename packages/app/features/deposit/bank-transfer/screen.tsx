import { YStack, Paragraph, Spinner, Button, Input } from '@my/ui'
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
import { useUser } from 'app/utils/useUser'

export function BankTransferScreen() {
  const { user } = useUser()
  const { data: sendAccount } = useSendAccount()
  const { kycStatus, isApproved, isLoading: kycLoading, customer } = useKycStatus()
  const { hasVirtualAccount, bankDetails, isLoading: vaLoading } = useBankAccountDetails()
  const initiateKyc = useInitiateKyc()
  const createVirtualAccount = useCreateVirtualAccount()
  const [kycUrl, setKycUrl] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!emailTouched && !email && user?.email) {
      setEmail(user.email)
    }
  }, [email, emailTouched, user?.email])

  const trimmedEmail = email.trim()
  const canStartKyc = Boolean(trimmedEmail)
  const shouldCollectKycDetails = !customer

  const handleStartKyc = useCallback(async () => {
    const resolvedEmail = email.trim()

    if (shouldCollectKycDetails) {
      if (!resolvedEmail) {
        setFormError('Enter your email to continue.')
        return
      }
    }

    try {
      setFormError(null)
      const result = await initiateKyc.mutateAsync(
        shouldCollectKycDetails ? { email: resolvedEmail } : {}
      )
      // Open KYC link in browser (platform-safe)
      if (result.kycLink) {
        await Linking.openURL(result.kycLink)
        setKycUrl(result.kycLink)
      }
    } catch (error) {
      console.error('Failed to initiate KYC:', error)
    }
  }, [email, initiateKyc, shouldCollectKycDetails])

  const handleCreateVirtualAccount = useCallback(async () => {
    if (!sendAccount?.address) return

    try {
      await createVirtualAccount.mutateAsync(sendAccount.address)
    } catch (error) {
      console.error('Failed to create virtual account:', error)
    }
  }, [sendAccount, createVirtualAccount])

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
        {shouldCollectKycDetails && (
          <YStack gap="$3">
            <Paragraph fontSize="$4" color="$lightGrayTextField">
              Enter the email you want to use for identity verification.
            </Paragraph>
            <YStack gap="$2">
              <Paragraph fontSize="$3" color="$lightGrayTextField">
                Email
              </Paragraph>
              <Input
                size="$4"
                value={email}
                onChangeText={(text) => {
                  setEmailTouched(true)
                  setEmail(text)
                  if (formError) setFormError(null)
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor="$color4"
              />
            </YStack>
            {formError && (
              <Paragraph fontSize="$3" color="$red10">
                {formError}
              </Paragraph>
            )}
          </YStack>
        )}
        <KycStatusCard
          kycStatus={kycStatus}
          onStartKyc={handleStartKyc}
          isLoading={initiateKyc.isPending}
          startDisabled={shouldCollectKycDetails ? !canStartKyc : undefined}
        />

        {kycUrl && (
          <Paragraph fontSize="$3" color="$lightGrayTextField" ta="center">
            Verification window opened. Complete the process and return here.
          </Paragraph>
        )}
      </YStack>
    )
  }

  // Approved but no virtual account - offer to create one
  if (!hasVirtualAccount) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <KycStatusCard kycStatus="approved" />

        <YStack gap="$3">
          <Paragraph fontSize="$5">
            Your identity is verified. Create a virtual bank account to start receiving deposits.
          </Paragraph>
          <Button
            size="$4"
            theme="green"
            onPress={handleCreateVirtualAccount}
            disabled={createVirtualAccount.isPending || !sendAccount?.address}
            icon={createVirtualAccount.isPending ? <Spinner size="small" /> : undefined}
          >
            Create Bank Account
          </Button>
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
      <Paragraph fontSize="$5" color="$lightGrayTextField">
        Send USD via ACH or wire transfer to this account. Funds will be converted to USDC and
        deposited to your wallet.
      </Paragraph>

      <BankDetailsCard
        bankName={bankDetails.bankName}
        routingNumber={bankDetails.routingNumber}
        accountNumber={bankDetails.accountNumber}
        beneficiaryName={bankDetails.beneficiaryName}
        paymentRails={bankDetails.paymentRails}
      />

      <Paragraph fontSize="$3" color="$lightGrayTextField" ta="center">
        Deposits typically arrive within 1-3 business days.
      </Paragraph>
    </YStack>
  )
}
