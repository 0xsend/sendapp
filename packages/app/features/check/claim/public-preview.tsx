import { Button, Card, Paragraph, Spinner, useAppToast, XStack, YStack } from '@my/ui'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'
import { useEffect, useCallback, useState } from 'react'
import { CheckPreviewCard, useCheckPreview } from './components/CheckPreviewCard'
import { useSetReferralCode } from 'app/utils/useReferralCode'
import { useSendAccount, useSignIn } from 'app/utils/send-accounts'
import { setAfterLoginRedirect } from 'app/utils/afterLoginRedirect'
import { formatErrorMessage } from 'app/utils/formatErrorMessage'
import useAuthRedirect from 'app/utils/useAuthRedirect/useAuthRedirect'

interface CheckPublicPreviewScreenProps {
  checkCode: string
}

export function CheckPublicPreviewScreen({ checkCode }: CheckPublicPreviewScreenProps) {
  const router = useRouter()
  const { t } = useTranslation('send')
  const toast = useAppToast()
  const { mutate: setReferralCode } = useSetReferralCode()
  const { data: sendAccount, isLoading: isLoadingAccount } = useSendAccount()
  const { mutateAsync: signInMutateAsync } = useSignIn()
  const { redirect } = useAuthRedirect()
  const [isSigningIn, setIsSigningIn] = useState(false)

  // Use shared preview hook (chain is encoded in the checkCode)
  const { checkDetails, previewData, isLoading, error } = useCheckPreview(checkCode || null)

  // Redirect logged-in users to claim page
  useEffect(() => {
    if (!isLoadingAccount && sendAccount && checkCode) {
      router.replace(`/check/claim/${checkCode}`)
    }
  }, [isLoadingAccount, sendAccount, checkCode, router])

  // Set the sender's sendtag as the referral code when preview loads
  useEffect(() => {
    if (previewData?.senderTag) {
      setReferralCode(previewData.senderTag)
    }
  }, [previewData?.senderTag, setReferralCode])

  const handleRegister = useCallback(() => {
    setAfterLoginRedirect(`/check/claim/${checkCode}`)
    router.push('/auth/sign-up')
  }, [checkCode, router])

  const handleSignIn = useCallback(async () => {
    setAfterLoginRedirect(`/check/claim/${checkCode}`)
    setIsSigningIn(true)

    try {
      await signInMutateAsync({})
      redirect()
    } catch (err) {
      setIsSigningIn(false)
      toast.error(formatErrorMessage(err))
    }
  }, [checkCode, signInMutateAsync, redirect, toast])

  // Loading state (including redirect for logged-in users, or waiting for router hydration)
  if (isLoading || isLoadingAccount || sendAccount || !checkCode) {
    return (
      <YStack f={1} gap="$5" w="100%" maxWidth={600} ai="center" jc="center">
        <Spinner size="large" />
        <Paragraph color="$color10">{t('check.claim.verifying')}</Paragraph>
      </YStack>
    )
  }

  const isNotFound = error || !checkDetails

  return (
    <YStack f={1} gap="$4" w="100%" maxWidth={600}>
      {isNotFound ? (
        <Card padded elevation={1} br="$5">
          <YStack ai="center" gap="$4" py="$4">
            <Paragraph color="$color10" size="$4" ta="center">
              {t('check.claim.notFoundMessage')}
            </Paragraph>
          </YStack>
        </Card>
      ) : (
        <CheckPreviewCard checkCode={checkCode} />
      )}

      {!isNotFound && (
        <>
          {/* Register Button */}
          <Button
            size="$5"
            onPress={handleRegister}
            bc="$primary"
            $theme-light={{ bc: '$color12' }}
          >
            <Button.Text color="$color1" fontWeight="600">
              {t('check.claim.public.registerButton')}
            </Button.Text>
          </Button>

          {/* Sign In Link */}
          <XStack w="100%" gap="$2" jc="center" ai="center">
            <Paragraph $theme-light={{ color: '$darkGrayTextField' }}>
              {t('check.claim.public.alreadyHaveAccount')}
            </Paragraph>
            <Button
              onPress={handleSignIn}
              disabled={isSigningIn}
              transparent
              chromeless
              backgroundColor="transparent"
              hoverStyle={{ backgroundColor: 'transparent' }}
              pressStyle={{ backgroundColor: 'transparent' }}
              focusStyle={{ backgroundColor: 'transparent' }}
              bw={0}
              br={0}
              height="auto"
              p={0}
            >
              <Button.Text color="$primary" $theme-light={{ color: '$color12' }}>
                {isSigningIn ? 'Signing in...' : t('check.claim.public.signIn')}
              </Button.Text>
            </Button>
          </XStack>
        </>
      )}
    </YStack>
  )
}

export default CheckPublicPreviewScreen
