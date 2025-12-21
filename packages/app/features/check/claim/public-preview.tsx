import { Button, Card, Paragraph, Spinner, XStack, YStack } from '@my/ui'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { CheckPreviewCard, useCheckPreview } from './components/CheckPreviewCard'
import { useSetReferralCode } from 'app/utils/useReferralCode'
import { useSendAccount } from 'app/utils/send-accounts'

interface CheckPublicPreviewScreenProps {
  checkCode: string
}

export function CheckPublicPreviewScreen({ checkCode }: CheckPublicPreviewScreenProps) {
  const router = useRouter()
  const { t } = useTranslation('send')
  const { mutate: setReferralCode } = useSetReferralCode()
  const { data: sendAccount, isLoading: isLoadingAccount } = useSendAccount()

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

  // Loading state (including redirect for logged-in users)
  if (isLoading || isLoadingAccount || sendAccount) {
    return (
      <YStack f={1} gap="$5" w="100%" maxWidth={600} ai="center" jc="center">
        <Spinner size="large" />
        <Paragraph color="$color10">{t('check.claim.verifying')}</Paragraph>
      </YStack>
    )
  }

  // Error state
  if (error || !checkDetails) {
    return (
      <YStack f={1} gap="$5" w="100%" maxWidth={600}>
        <Card padded elevation={1} br="$5">
          <YStack ai="center" gap="$4" py="$4">
            <Paragraph color="$error" size="$5" fontWeight="600">
              {t('check.claim.notFound')}
            </Paragraph>
          </YStack>
        </Card>
      </YStack>
    )
  }

  // Build sign-up URL with redirect to claim after auth
  const redirectUri = encodeURIComponent(`/check/claim/${checkCode}`)

  return (
    <YStack f={1} gap="$4" w="100%" maxWidth={600}>
      <CheckPreviewCard checkCode={checkCode} />

      {/* Register Button */}
      <Button
        size="$5"
        onPress={() => router.push(`/auth/sign-up?redirectUri=${redirectUri}`)}
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
          onPress={() => router.push(`/auth/sign-in?redirectUri=${redirectUri}`)}
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
            {t('check.claim.public.signIn')}
          </Button.Text>
        </Button>
      </XStack>
    </YStack>
  )
}

export default CheckPublicPreviewScreen
