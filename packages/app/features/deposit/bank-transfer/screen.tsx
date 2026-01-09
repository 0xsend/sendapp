import { YStack, Paragraph, Spinner, Anchor, FadeCard, Button } from '@my/ui'
import { useCallback, useEffect, useState } from 'react'
import { Linking } from 'react-native'
import { BankDetailsCard, BankDetailsCardSkeleton } from './BankDetailsCard'
import { KycStatusCard } from './KycStatusCard'
import {
  useBridgeGeoBlock,
  useKycStatus,
  useInitiateKyc,
  useCreateTransferTemplate,
  useTransferTemplateBankAccountDetails,
} from 'app/features/bank-transfer'
import { useThemeSetting } from '@tamagui/next-theme'
import { useRedirectUri } from 'app/utils/useRedirectUri'

export function BankTransferScreen() {
  const {
    kycStatus,
    isTosAccepted,
    isApproved,
    rejectionReasons,
    isMaxAttemptsExceeded,
    isLoading: kycLoading,
  } = useKycStatus()
  const {
    hasTransferTemplate,
    bankDetails,
    isLoading: templateLoading,
  } = useTransferTemplateBankAccountDetails()
  const initiateKyc = useInitiateKyc()
  const createTransferTemplate = useCreateTransferTemplate()
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

  // Auto-create transfer template once approved
  const {
    mutate: createTemplate,
    isPending: isTemplateCreating,
    isError: templateCreationError,
  } = createTransferTemplate
  useEffect(() => {
    if (
      !isGeoBlocked &&
      isApproved &&
      !hasTransferTemplate &&
      !templateLoading &&
      !isTemplateCreating &&
      !templateCreationError
    ) {
      createTemplate()
    }
  }, [
    isGeoBlocked,
    isApproved,
    hasTransferTemplate,
    templateLoading,
    isTemplateCreating,
    templateCreationError,
    createTemplate,
  ])

  // Handler to retry transfer template creation
  const handleRetryTemplateCreation = useCallback(() => {
    createTransferTemplate.reset()
    createTransferTemplate.mutate()
  }, [createTransferTemplate])

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
          isMaxAttemptsExceeded={isMaxAttemptsExceeded}
          onStartKyc={handleStartKyc}
          isLoading={initiateKyc.isPending}
        />
      </YStack>
    )
  }

  // Approved but setting up deposit account (auto-creating in background)
  if (!hasTransferTemplate) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <FadeCard>
          <YStack gap="$4">
            <Paragraph fontSize="$6" fontWeight={600}>
              {templateCreationError ? 'Setup Failed' : 'Setting Up Your Account'}
            </Paragraph>
            <Paragraph
              fontSize="$4"
              color="$lightGrayTextField"
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              {templateCreationError
                ? 'We encountered an issue creating your deposit account. Please try again.'
                : "Your identity has been verified. We're now creating your deposit account."}
            </Paragraph>
            {isTemplateCreating && (
              <YStack ai="center" py="$2">
                <Spinner size="small" color="$primary" />
              </YStack>
            )}
            {templateCreationError && (
              <Button
                size="$4"
                theme="green"
                onPress={handleRetryTemplateCreation}
                disabled={isTemplateCreating}
              >
                Try Again
              </Button>
            )}
          </YStack>
        </FadeCard>
      </YStack>
    )
  }

  // Has transfer template - show bank details
  if (templateLoading || !bankDetails) {
    return (
      <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
        <BankDetailsCardSkeleton />
      </YStack>
    )
  }

  return (
    <YStack width="100%" gap="$5" $gtLg={{ width: '50%' }}>
      <BankDetailsCard
        bankName={bankDetails.bankName}
        routingNumber={bankDetails.routingNumber}
        accountNumber={bankDetails.accountNumber}
        beneficiaryName={bankDetails.beneficiaryName}
        depositMessage={bankDetails.depositMessage}
        paymentRails={bankDetails.paymentRails}
      />
    </YStack>
  )
}
