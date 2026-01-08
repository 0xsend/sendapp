import { YStack, Paragraph, Spinner, Anchor, FadeCard, Button } from '@my/ui'
import { useCallback, useEffect, useState } from 'react'
import { Linking } from 'react-native'
import { BankDetailsCard, BankDetailsCardSkeleton } from './BankDetailsCard'
import { KycStatusCard } from './KycStatusCard'
import {
  useBridgeGeoBlock,
  useKycStatus,
  useInitiateKyc,
  useBankAccountDetails,
  useCreateVirtualAccount,
} from 'app/features/bank-transfer'
import { useSendAccount } from 'app/utils/send-accounts'
import { useThemeSetting } from '@tamagui/next-theme'
import { useRedirectUri } from 'app/utils/useRedirectUri'

export function BankTransferScreen() {
  const { data: sendAccount } = useSendAccount()
  const {
    kycStatus,
    isTosAccepted,
    isApproved,
    rejectionReasons,
    isLoading: kycLoading,
  } = useKycStatus()
  const { hasVirtualAccount, bankDetails, isLoading: vaLoading } = useBankAccountDetails()
  const initiateKyc = useInitiateKyc()
  const createVirtualAccount = useCreateVirtualAccount()
  const { data: isGeoBlocked, isLoading: isGeoBlockLoading } = useBridgeGeoBlock()
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null)
  // Track which step we're waiting for: 'tos', 'kyc', or null
  const [waitingFor, setWaitingFor] = useState<'tos' | 'kyc' | null>(null)
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')
  const redirectUri = useRedirectUri()

  const handleStartKyc = useCallback(async () => {
    if (isGeoBlocked) {
      return
    }
    try {
      const result = await initiateKyc.mutateAsync({ redirectUri })
      // If TOS is already accepted, go straight to KYC
      // Otherwise, open TOS link first (Bridge requires TOS acceptance before KYC)
      const urlToOpen = isTosAccepted ? result.kycLink : result.tosLink || result.kycLink
      if (urlToOpen) {
        await Linking.openURL(urlToOpen)
        setVerificationUrl(result.kycLink)
        setWaitingFor(isTosAccepted ? 'kyc' : 'tos')
      }
    } catch (error) {
      console.error('Failed to initiate KYC:', error)
    }
  }, [initiateKyc, isGeoBlocked, isTosAccepted, redirectUri])

  const handleOpenVerificationLink = useCallback(() => {
    if (verificationUrl) {
      Linking.openURL(verificationUrl)
    }
  }, [verificationUrl])

  // Stop waiting when the relevant status changes
  useEffect(() => {
    if (waitingFor === 'tos' && isTosAccepted) {
      setWaitingFor(null)
    } else if (waitingFor === 'kyc' && kycStatus !== 'not_started') {
      setWaitingFor(null)
    }
  }, [kycStatus, isTosAccepted, waitingFor])

  // Auto-create virtual account once approved
  const {
    mutate: createVa,
    isPending: isVaCreating,
    isError: vaCreationError,
  } = createVirtualAccount
  useEffect(() => {
    if (
      !isGeoBlocked &&
      isApproved &&
      !hasVirtualAccount &&
      !vaLoading &&
      sendAccount?.address &&
      !isVaCreating &&
      !vaCreationError
    ) {
      createVa(sendAccount.address)
    }
  }, [
    isGeoBlocked,
    isApproved,
    hasVirtualAccount,
    vaLoading,
    sendAccount?.address,
    isVaCreating,
    vaCreationError,
    createVa,
  ])

  // Handler to retry virtual account creation
  const handleRetryVaCreation = useCallback(() => {
    if (sendAccount?.address) {
      createVirtualAccount.reset()
      createVirtualAccount.mutate(sendAccount.address)
    }
  }, [sendAccount?.address, createVirtualAccount])

  // Loading state
  if (kycLoading || isGeoBlockLoading) {
    return (
      <YStack f={1} ai="center" jc="center" py="$8">
        <Spinner size="large" color="$primary" />
      </YStack>
    )
  }

  if (isGeoBlocked) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <FadeCard ai="center">
          <Paragraph size="$6" fontWeight={600} ta="center">
            Bank transfers aren't available in your region.
          </Paragraph>
          <Paragraph
            ta="center"
            size="$4"
            color="$lightGrayTextField"
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            We can't offer ACH or wire transfers where you're located.
          </Paragraph>
        </FadeCard>
      </YStack>
    )
  }

  // Waiting for TOS or KYC to complete
  if (waitingFor) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <FadeCard ai="center">
          <Spinner size="large" color={isDarkTheme ? '$primary' : '$color12'} />
          <YStack ai="center" gap="$2">
            <Paragraph size="$8" fontWeight={500} $gtLg={{ size: '$9' }} ta="center">
              Hold tight...
            </Paragraph>
            <Paragraph
              ta="center"
              size="$5"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              {waitingFor === 'tos'
                ? 'Accept the Terms of Service in your browser window.'
                : 'Complete the verification in your browser window.'}
            </Paragraph>
            <Paragraph
              ta="center"
              size="$3"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              Already finished? It may take a few seconds to update.
            </Paragraph>
          </YStack>
          <Anchor
            size="$4"
            color="$primary"
            onPress={handleOpenVerificationLink}
            cursor="pointer"
            hoverStyle={{ opacity: 0.8 }}
          >
            {waitingFor === 'tos'
              ? 'Open Terms of Service window again'
              : 'Open verification window again'}
          </Anchor>
        </FadeCard>
      </YStack>
    )
  }

  // Not approved - show KYC status
  if (!isApproved) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <KycStatusCard
          kycStatus={kycStatus}
          isTosAccepted={isTosAccepted}
          rejectionReasons={rejectionReasons}
          onStartKyc={handleStartKyc}
          isLoading={initiateKyc.isPending}
        />
      </YStack>
    )
  }

  // Approved but setting up deposit account (auto-creating in background)
  if (!hasVirtualAccount) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <FadeCard>
          <YStack gap="$4">
            <Paragraph fontSize="$6" fontWeight={600}>
              {vaCreationError ? 'Setup Failed' : 'Setting Up Your Account'}
            </Paragraph>
            <Paragraph
              fontSize="$4"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              {vaCreationError
                ? 'We encountered an issue creating your deposit account. Please try again.'
                : "Your identity has been verified. We're now creating your deposit account."}
            </Paragraph>
            {isVaCreating && (
              <YStack ai="center" py="$2">
                <Spinner size="small" color="$primary" />
              </YStack>
            )}
            {vaCreationError && (
              <Button
                size="$4"
                theme="green"
                onPress={handleRetryVaCreation}
                disabled={isVaCreating}
              >
                Try Again
              </Button>
            )}
          </YStack>
        </FadeCard>
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
