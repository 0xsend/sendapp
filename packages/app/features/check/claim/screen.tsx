import { Button, Card, Input, Label, Paragraph, Spinner, XStack, YStack } from '@my/ui'
import { Gift } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'
import { useState, useMemo } from 'react'
import { useCheckDetails, parseCheckCode } from 'app/utils/useSendCheckClaim'

export function CheckClaimScreen() {
  const router = useRouter()
  const { t } = useTranslation('send')
  const [checkCode, setCheckCode] = useState('')

  const isValidCode = useMemo(() => {
    if (!checkCode) return false
    return parseCheckCode(checkCode) !== null
  }, [checkCode])

  // Fetch check details when code is valid (for validation)
  const {
    data: checkDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useCheckDetails(isValidCode ? checkCode : null)

  const isCheckValid = checkDetails && !checkDetails.isExpired && !checkDetails.isClaimed
  const canContinue = isValidCode && isCheckValid && !isLoadingDetails

  const onContinue = () => {
    // Encode the check code for URL
    const encodedCode = encodeURIComponent(checkCode.replace(/-/g, ''))
    router.push(`/check/claim/preview?code=${encodedCode}`)
  }

  return (
    <YStack f={1} gap="$5" w="100%" maxWidth={600}>
      <Card padded elevation={1} br="$5" gap="$5">
        <XStack ai="center" gap="$3">
          <XStack w="$4" h="$4" br="$4" ai="center" jc="center" bc="$color3">
            <Gift size="$1.5" color="$color12" />
          </XStack>
          <YStack f={1}>
            <Paragraph color="$color12" fontWeight="600" fontSize="$5">
              {t('check.claim.title')}
            </Paragraph>
            <Paragraph color="$color10" size="$3">
              {t('check.claim.codeDescription')}
            </Paragraph>
          </YStack>
        </XStack>

        <YStack gap="$2">
          <Label color="$color10" textTransform="uppercase" fontSize="$3">
            {t('check.claim.codeLabel')}
          </Label>
          <Input
            value={checkCode}
            onChangeText={setCheckCode}
            placeholder={t('check.claim.codePlaceholder')}
            fontSize="$5"
            fontFamily="$mono"
            fontWeight="500"
            color="$color12"
            placeholderTextColor="$color4"
            br="$4"
            autoCapitalize="characters"
          />
          {checkCode && !isValidCode && (
            <Paragraph color="$error" size="$3">
              {t('check.claim.invalidCode')}
            </Paragraph>
          )}
        </YStack>

        {/* Validation Status */}
        {isValidCode && (
          <YStack gap="$2">
            {isLoadingDetails ? (
              <XStack ai="center" gap="$2">
                <Spinner size="small" />
                <Paragraph color="$color10" size="$3">
                  {t('check.claim.verifying')}
                </Paragraph>
              </XStack>
            ) : detailsError ? (
              <Paragraph color="$error" size="$3">
                {t('check.claim.verifyError')}
              </Paragraph>
            ) : !checkDetails ? (
              <Paragraph color="$error" size="$3">
                {t('check.claim.notFound')}
              </Paragraph>
            ) : checkDetails.isClaimed ? (
              <Paragraph color="$orange10" size="$3">
                {t('check.claim.alreadyClaimed')}
              </Paragraph>
            ) : checkDetails.isExpired ? (
              <Paragraph color="$error" size="$3">
                {t('check.claim.expired')}
              </Paragraph>
            ) : null}
          </YStack>
        )}
      </Card>

      <Button
        size="$5"
        disabled={!canContinue}
        onPress={onContinue}
        bc="$primary"
        $theme-light={{ bc: '$color12' }}
        disabledStyle={{ opacity: 0.5 }}
      >
        <Button.Text color="$color1" fontWeight="600">
          {t('check.claim.continue')}
        </Button.Text>
      </Button>
    </YStack>
  )
}

export default CheckClaimScreen
