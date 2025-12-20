import { Button, Card, FadeCard, H3, Paragraph, Spinner, useAppToast, XStack, YStack } from '@my/ui'
import { CheckCircle, Clock, Gift, Plus, RotateCcw, XCircle } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'
import { useState, useCallback, useMemo } from 'react'
import { useSendAccount } from 'app/utils/send-accounts'
import {
  useUserActiveChecks,
  useUserChecksHistory,
  useSendCheckRevoke,
  type ActiveCheck,
  type CheckHistory,
} from 'app/utils/useSendCheckManagement'
import { formatUnits, type Hex } from 'viem'
import { allCoinsDict } from 'app/data/coins'
import debug from 'debug'

const log = debug('app:features:check')

export function CheckScreen() {
  const router = useRouter()
  const { t } = useTranslation('send')

  return (
    <YStack f={1} gap="$5" w="100%" maxWidth={600}>
      <FadeCard>
        <YStack gap="$4">
          <H3 color="$color12">{t('check.manage.title')}</H3>
          <ActiveChecksList />
          <ChecksHistorySection />
        </YStack>
        <XStack gap="$3">
          <Button
            size="$5"
            f={1}
            onPress={() => router.push('/check/claim')}
            bc="$color3"
            $theme-light={{ bc: '$gray3' }}
          >
            <Button.Icon>
              <Gift size="$1" color="$color12" />
            </Button.Icon>
            <Button.Text color="$color12" fontWeight="600">
              {t('check.claim.title')}
            </Button.Text>
          </Button>
          <Button
            size="$5"
            f={1}
            onPress={() => router.push('/check/create')}
            bc="$primary"
            $theme-light={{ bc: '$color12' }}
          >
            <Button.Icon>
              <Plus size="$1" color="$color1" />
            </Button.Icon>
            <Button.Text color="$color1" fontWeight="600">
              {t('check.button')}
            </Button.Text>
          </Button>
        </XStack>
      </FadeCard>
    </YStack>
  )
}

function ActiveChecksList() {
  const { t } = useTranslation('send')
  const { data: checks, isLoading, error } = useUserActiveChecks()

  if (isLoading) {
    return (
      <YStack ai="center" jc="center" gap="$2" py="$4">
        <Spinner size="small" />
        <Paragraph color="$color10" size="$3">
          {t('check.manage.loading')}
        </Paragraph>
      </YStack>
    )
  }

  if (error) {
    return (
      <YStack ai="center" jc="center" gap="$2" py="$4">
        <XCircle size="$1.5" color="$error" />
        <Paragraph color="$error" size="$3">
          {t('check.manage.error')}
        </Paragraph>
      </YStack>
    )
  }

  if (!checks || checks.length === 0) {
    return (
      <Paragraph color="$color10" size="$3" py="$4">
        {t('check.manage.noActiveChecks')}
      </Paragraph>
    )
  }

  return (
    <YStack gap="$2">
      {checks.map((check) => (
        <ActiveCheckCard key={check.id} check={check} />
      ))}
    </YStack>
  )
}

function ActiveCheckCard({ check }: { check: ActiveCheck }) {
  const { t } = useTranslation('send')
  const toast = useAppToast()
  const { data: sendAccount } = useSendAccount()
  const { revokeCheck, isPending: isRevoking } = useSendCheckRevoke()
  const [isConfirming, setIsConfirming] = useState(false)

  const webauthnCreds = useMemo(
    () =>
      sendAccount?.send_account_credentials
        ?.filter((c) => !!c.webauthn_credentials)
        ?.map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? [],
    [sendAccount?.send_account_credentials]
  )

  const tokenAddress = check.token.startsWith('\\x') ? `0x${check.token.slice(2)}` : check.token
  const coin = allCoinsDict[tokenAddress.toLowerCase()]
  const decimals = coin?.decimals ?? 18
  const symbol = coin?.symbol ?? 'tokens'
  const formattedAmount = formatUnits(check.amount, decimals)

  const expiresAt = new Date(check.expires_at * 1000)
  const isExpired = check.is_expired

  const handleRevoke = useCallback(async () => {
    if (!isConfirming) {
      setIsConfirming(true)
      return
    }

    try {
      const ephemeralAddress = check.ephemeral_address.startsWith('\\x')
        ? (`0x${check.ephemeral_address.slice(2)}` as Hex)
        : (check.ephemeral_address as Hex)

      await revokeCheck({ ephemeralAddress, webauthnCreds })
      toast.show(t('check.manage.revokeSuccess'))
    } catch (error) {
      log('Failed to revoke check:', error)
      toast.error(error instanceof Error ? error.message : t('check.manage.revokeError'))
    } finally {
      setIsConfirming(false)
    }
  }, [isConfirming, check.ephemeral_address, revokeCheck, webauthnCreds, toast, t])

  const handleCancelConfirm = useCallback(() => {
    setIsConfirming(false)
  }, [])

  return (
    <Card padded elevation={1} br="$4" p="$3">
      <XStack jc="space-between" ai="center">
        <YStack gap="$1">
          <Paragraph color="$color12" fontWeight="600" fontSize="$4">
            {formattedAmount} {symbol}
          </Paragraph>
          <XStack ai="center" gap="$1">
            <Clock size="$0.5" color={isExpired ? '$error' : '$color10'} />
            <Paragraph color={isExpired ? '$error' : '$color10'} fontSize="$2">
              {isExpired
                ? t('check.manage.expired')
                : `${t('check.manage.expiresAt')} ${expiresAt.toLocaleDateString()}`}
            </Paragraph>
          </XStack>
        </YStack>

        {isConfirming ? (
          <XStack gap="$2">
            <Button
              size="$2"
              variant="outlined"
              onPress={handleCancelConfirm}
              disabled={isRevoking}
            >
              <Button.Text fontSize="$2">{t('check.manage.cancel')}</Button.Text>
            </Button>
            <Button
              size="$2"
              bc="$error"
              onPress={handleRevoke}
              disabled={isRevoking || webauthnCreds.length === 0}
            >
              {isRevoking ? (
                <Spinner size="small" color="$color1" />
              ) : (
                <Button.Text color="$color1" fontSize="$2">
                  {t('check.manage.confirmRevoke')}
                </Button.Text>
              )}
            </Button>
          </XStack>
        ) : (
          <Button
            size="$2"
            variant="outlined"
            onPress={handleRevoke}
            disabled={webauthnCreds.length === 0}
          >
            <Button.Icon>
              <RotateCcw size="$0.75" />
            </Button.Icon>
            <Button.Text fontSize="$2">{t('check.manage.revoke')}</Button.Text>
          </Button>
        )}
      </XStack>
    </Card>
  )
}

function ChecksHistorySection() {
  const { t } = useTranslation('send')
  const { data: checks, isLoading, error } = useUserChecksHistory()
  const [showHistory, setShowHistory] = useState(false)

  if (isLoading || error || !checks || checks.length === 0) {
    return null
  }

  return (
    <YStack gap="$2">
      <Button
        size="$3"
        chromeless
        onPress={() => setShowHistory(!showHistory)}
        jc="flex-start"
        px="$0"
      >
        <Button.Text color="$color10" fontSize="$3">
          {showHistory ? t('check.manage.hideHistory') : t('check.manage.showHistory')} (
          {checks.length})
        </Button.Text>
      </Button>

      {showHistory && (
        <YStack gap="$2">
          {checks.map((check) => (
            <HistoryCheckCard key={check.id} check={check} />
          ))}
        </YStack>
      )}
    </YStack>
  )
}

function HistoryCheckCard({ check }: { check: CheckHistory }) {
  const { t } = useTranslation('send')

  const tokenAddress = check.token.startsWith('\\x') ? `0x${check.token.slice(2)}` : check.token
  const coin = allCoinsDict[tokenAddress.toLowerCase()]
  const decimals = coin?.decimals ?? 18
  const symbol = coin?.symbol ?? 'tokens'
  const formattedAmount = formatUnits(check.amount, decimals)

  const createdAt = new Date(check.block_time * 1000)

  return (
    <Card padded elevation={1} br="$4" p="$3">
      <XStack jc="space-between" ai="center">
        <YStack gap="$1">
          <Paragraph color="$color12" fontWeight="600" fontSize="$4">
            {formattedAmount} {symbol}
          </Paragraph>
          <Paragraph color="$color10" fontSize="$2">
            {createdAt.toLocaleDateString()}
          </Paragraph>
        </YStack>
        <XStack
          ai="center"
          gap="$1"
          bc={check.is_claimed ? '$green3' : '$color3'}
          px="$2"
          py="$1"
          br="$2"
        >
          {check.is_claimed ? (
            <CheckCircle size="$0.5" color="$green10" />
          ) : (
            <Clock size="$0.5" color="$color10" />
          )}
          <Paragraph
            color={check.is_claimed ? '$green10' : '$color10'}
            fontSize="$2"
            fontWeight="500"
          >
            {check.is_claimed ? t('check.manage.claimed') : t('check.manage.pending')}
          </Paragraph>
        </XStack>
      </XStack>
    </Card>
  )
}

export default CheckScreen
