import {
  Button,
  FadeCard,
  Paragraph,
  PrimaryButton,
  Shimmer,
  Spinner,
  Text,
  useAppToast,
  XStack,
  YStack,
} from '@my/ui'
import { ArrowUp, Clock, Plus, XCircle } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'
import { useState, useCallback, useMemo, memo } from 'react'
import { useSendAccount } from 'app/utils/send-accounts'
import { useUserSendChecks, useSendCheckRevoke, type Check } from 'app/utils/useSendCheck'
import { formatUnits, checksumAddress } from 'viem'
import { allCoinsDict, type coin } from 'app/data/coins'
import { FlashList } from '@shopify/flash-list'
import { IconCoin } from 'app/components/icons'
import { byteaToHex } from 'app/utils/byteaToHex'
import type { PgBytea } from '@my/supabase/database.types'
import debug from 'debug'

const log = debug('app:features:check')

// Activity-style row height
const ROW_HEIGHT = 102

export function CheckScreen() {
  const router = useRouter()
  const { t } = useTranslation('send')

  return (
    <YStack f={1} gap="$5" w="100%" maxWidth={600}>
      <FadeCard>
        <ChecksList />
        <PrimaryButton onPress={() => router.push('/check/send')}>
          <PrimaryButton.Icon>
            <Plus size={16} color="$black" />
          </PrimaryButton.Icon>
          <PrimaryButton.Text>{t('check.button')}</PrimaryButton.Text>
        </PrimaryButton>
      </FadeCard>
    </YStack>
  )
}

function ChecksList() {
  const { t } = useTranslation('send')
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useUserSendChecks()

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage, isFetchingNextPage])

  const flattenedChecks = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flat()
  }, [data?.pages])

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

  if (flattenedChecks.length === 0) {
    return (
      <Paragraph color="$color10" size="$3" py="$4">
        {t('check.manage.noActiveChecks')}
      </Paragraph>
    )
  }

  return (
    <YStack f={1} minHeight={200}>
      <FlashList
        data={flattenedChecks}
        estimatedItemSize={ROW_HEIGHT}
        keyExtractor={(item) => `${item.ephemeral_address}-${item.chain_id}`}
        renderItem={({ item, index }) => (
          <CheckCard
            check={item}
            isFirst={index === 0}
            isLast={index === flattenedChecks.length - 1}
          />
        )}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={hasNextPage ? <ListFooterComponent /> : null}
      />
    </YStack>
  )
}

/**
 * Parse tokens and amounts into display items
 * Note: amounts come from Postgres as strings (numeric type) to preserve precision
 */
function useTokenItems(tokens: string[], amounts: (string | number)[]) {
  return useMemo(() => {
    const items: { coin: coin | undefined; formatted: string }[] = []
    for (let i = 0; i < tokens.length; i++) {
      const rawToken = tokens[i]
      if (!rawToken) continue
      const tokenAddress = checksumAddress(byteaToHex(rawToken as PgBytea))
      const tokenCoin = allCoinsDict[tokenAddress as keyof typeof allCoinsDict]
      const decimals = tokenCoin?.decimals ?? 18
      const rawAmount = amounts[i]
      const amount = rawAmount ? BigInt(rawAmount.toString()) : 0n
      const formatted = formatUnits(amount, decimals)
      items.push({ coin: tokenCoin, formatted })
    }
    return items
  }, [tokens, amounts])
}

/**
 * Avatar-style icon for the check (shows first token's coin icon with send arrow)
 */
function CheckAvatar({ tokens }: { tokens: string[] }) {
  const firstToken = tokens[0]
  if (!firstToken) {
    return (
      <XStack w={52} h={52} br="$4" bc="$color3" ai="center" jc="center">
        <Clock size="$2" color="$color10" />
      </XStack>
    )
  }
  const tokenAddress = checksumAddress(byteaToHex(firstToken as PgBytea))
  const tokenCoin = allCoinsDict[tokenAddress as keyof typeof allCoinsDict]

  return (
    <XStack w={52} h={52} ai="center" jc="center" position="relative">
      {tokenCoin ? (
        <IconCoin symbol={tokenCoin.symbol} size="$5" />
      ) : (
        <XStack w={52} h={52} br="$4" bc="$color3" ai="center" jc="center">
          <Clock size="$2" color="$color10" />
        </XStack>
      )}
      {/* Arrow indicator like activity feed */}
      <XStack
        position="absolute"
        bottom={0}
        right={0}
        x="$0.5"
        y="$0.5"
        scale={0.85}
        bc="$error"
        borderRadius={999}
        borderWidth={2}
        borderColor="$color1"
      >
        <ArrowUp size="$1" color="$white" />
      </XStack>
    </XStack>
  )
}

/**
 * Format relative time for display
 */
function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

interface CheckCardProps {
  check: Check
  isFirst: boolean
  isLast: boolean
}

const CheckCard = memo(function CheckCard({ check, isFirst, isLast }: CheckCardProps) {
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

  const tokenItems = useTokenItems(check.tokens ?? [], check.amounts ?? [])
  const expiresAt = new Date(Number(check.expires_at) * 1000)
  const createdAt = new Date(Number(check.block_time) * 1000)

  const handleRevoke = useCallback(async () => {
    if (!isConfirming) {
      setIsConfirming(true)
      return
    }

    try {
      const ephemeralAddress = byteaToHex(check.ephemeral_address as PgBytea)
      await revokeCheck({ ephemeralAddress, webauthnCreds })
      toast.show(t('check.manage.cancelSuccess'))
    } catch (error) {
      log('Failed to cancel check:', error)
      toast.error(error instanceof Error ? error.message : t('check.manage.cancelError'))
    } finally {
      setIsConfirming(false)
    }
  }, [isConfirming, check.ephemeral_address, revokeCheck, webauthnCreds, toast, t])

  const handleCancelConfirm = useCallback(() => {
    setIsConfirming(false)
  }, [])

  // Format amount text (e.g., "100 USDC" or "100 USDC + 50 SEND")
  const amountText = tokenItems
    .map((item) => `${item.formatted} ${item.coin?.symbol ?? 'tokens'}`)
    .join(' + ')

  // Title text based on status
  const getTitleText = () => {
    if (check.is_active) return t('check.manage.sentCheck')
    if (check.is_claimed) return t('check.manage.claimed')
    return t('check.manage.expired')
  }

  // Date text - show expiration for active, created date for others
  const getDateText = () => {
    if (check.is_active) {
      return `${t('check.manage.expiresAt')} ${expiresAt.toLocaleDateString()}`
    }
    return formatRelativeDate(createdAt)
  }

  // Border radius based on position
  const borderRadius = {
    borderTopLeftRadius: isFirst ? '$4' : 0,
    borderTopRightRadius: isFirst ? '$4' : 0,
    borderBottomLeftRadius: isLast ? '$4' : 0,
    borderBottomRightRadius: isLast ? '$4' : 0,
  }

  return (
    <XStack
      w="100%"
      h={ROW_HEIGHT}
      gap="$3.5"
      p="$3.5"
      bc="$background"
      borderWidth={1}
      borderColor="$color1"
      ai="flex-start"
      hoverStyle={{ bc: '$color2' }}
      cursor="pointer"
      {...borderRadius}
    >
      {/* Avatar */}
      <CheckAvatar tokens={check.tokens ?? []} />

      {/* Content - matches activity feed layout */}
      <YStack f={1} gap="$1" overflow="hidden">
        {/* Title row: event name + amount */}
        <XStack jc="space-between" gap="$1.5" w="100%">
          <Text color="$color12" fontSize="$5" fontWeight="500">
            {getTitleText()}
          </Text>
          <Text>&nbsp;</Text>
          <Text color="$color12" fontSize="$5" fontWeight="500" ta="right">
            {amountText}
          </Text>
        </XStack>

        {/* Date row + action */}
        <XStack jc="space-between" ai="center">
          <Paragraph color="$color10" size="$3" o={0.6}>
            {getDateText()}
          </Paragraph>

          {/* Cancel action for active checks only */}
          {check.is_active &&
            (isConfirming ? (
              <XStack gap="$2">
                <Button
                  size="$2"
                  variant="outlined"
                  onPress={handleCancelConfirm}
                  disabled={isRevoking}
                >
                  <Button.Text fontSize="$2">{t('check.manage.keepCheck')}</Button.Text>
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
                      {t('check.manage.confirmCancel')}
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
                  <XCircle size={14} />
                </Button.Icon>
                <Button.Text fontSize="$2">{t('check.manage.cancelCheck')}</Button.Text>
              </Button>
            ))}
        </XStack>
      </YStack>
    </XStack>
  )
})

function ListFooterComponent() {
  return (
    <Shimmer
      br="$4"
      componentName="Card"
      $theme-light={{ bg: '$background' }}
      w="100%"
      h={ROW_HEIGHT}
    />
  )
}

export default CheckScreen
