import {
  Button,
  Card,
  FadeCard,
  Input,
  Label,
  Paragraph,
  PrimaryButton,
  QRCode,
  Separator,
  Spinner,
  useAppToast,
  XStack,
  YStack,
} from '@my/ui'
import { AlertTriangle, Check, Copy } from '@tamagui/lucide-icons'
import { IconCoin, IconSend } from 'app/components/icons'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'
import { FormProvider, useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CoinField } from 'app/features/send/components/SendChat/CoinField'
import { useCoins } from 'app/provider/coins'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import formatAmount, { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'
import { formatUnits, type Hex } from 'viem'
import { allCoinsDict } from 'app/data/coins'
import { useState, useCallback, useMemo } from 'react'
import { useSendCheckCreate, type TokenAmount } from 'app/utils/useSendCheckCreate'
import { useSendAccount } from 'app/utils/send-accounts'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import * as Clipboard from 'expo-clipboard'
import debug from 'debug'

const log = debug('app:features:check:send')

const sendCheckSchema = z.object({
  token: z.string().min(1, 'Token required'),
  amount: z.string().min(1, 'Amount required'),
  expiresInDays: z.number().min(1).max(30).default(7),
})

type SendCheckFormValues = z.infer<typeof sendCheckSchema>

type CheckCreatedState = {
  claimUrl: string
  amount: string
  symbol: string
}

export function CheckSendScreen() {
  const router = useRouter()
  const { t } = useTranslation('send')
  const toast = useAppToast()
  const { coins, isLoading: isLoadingCoins } = useCoins()
  const { data: sendAccount } = useSendAccount()
  const [checkCreated, setCheckCreated] = useState<CheckCreatedState | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [hasCopiedLink, setHasCopiedLink] = useState(false)

  const webauthnCreds = useMemo(
    () =>
      sendAccount?.send_account_credentials
        ?.filter((c) => !!c.webauthn_credentials)
        ?.map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? [],
    [sendAccount?.send_account_credentials]
  )

  const form = useForm<SendCheckFormValues>({
    resolver: zodResolver(sendCheckSchema),
    defaultValues: {
      token: usdcAddress[baseMainnet.id],
      amount: '',
      expiresInDays: 30,
    },
  })

  const token = form.watch('token')
  const amount = form.watch('amount')
  const expiresInDays = form.watch('expiresInDays')

  const coin = coins.find((c) => c.token === token)
  const coinInfo = allCoinsDict[token]
  const decimals = coin?.decimals ?? coinInfo?.decimals ?? 18

  const parsedAmount = amount ? (sanitizeAmount(amount, decimals) ?? 0n) : 0n
  const balance = coin?.balance ?? 0n
  const hasInsufficientBalance = parsedAmount > balance

  // Compute tokenAmounts and expiresAt for fee estimation
  const tokenAmounts: TokenAmount[] | undefined = useMemo(() => {
    if (!token || parsedAmount <= 0n) return undefined
    return [{ token: token as Hex, amount: parsedAmount }]
  }, [token, parsedAmount])

  const expiresAt = useMemo(() => {
    return BigInt(Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60)
  }, [expiresInDays])

  const {
    createCheck,
    isPending: isSubmitting,
    isPreparing,
    isReady,
    checkAddress,
    usdcFees,
  } = useSendCheckCreate({ tokenAmounts, expiresAt })

  // Calculate total fee
  const totalFee = usdcFees ? usdcFees.baseFee + usdcFees.gasFees : undefined
  const feeDecimals = usdcFees?.decimals ?? 6

  const canSubmit =
    !isLoadingCoins &&
    !isSubmitting &&
    !isPreparing &&
    parsedAmount > 0n &&
    !hasInsufficientBalance &&
    isReady &&
    webauthnCreds.length > 0 &&
    !!checkAddress

  const copyLinkToClipboard = useCallback(async () => {
    if (!checkCreated?.claimUrl) return
    await Clipboard.setStringAsync(checkCreated.claimUrl)
    setCopiedLink(true)
    setHasCopiedLink(true)
    toast.show('Link copied!')
    setTimeout(() => setCopiedLink(false), 2000)
  }, [checkCreated?.claimUrl, toast])

  const onSubmit = async (values: SendCheckFormValues) => {
    try {
      const result = await createCheck({ webauthnCreds })

      setCheckCreated({
        claimUrl: result.claimUrl,
        amount: values.amount,
        symbol: coin?.symbol ?? coinInfo?.symbol ?? 'tokens',
      })
    } catch (error) {
      log('Failed to create check:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create check')
    }
  }

  // Success state after creating a check
  if (checkCreated) {
    return (
      <YStack f={1} gap="$5" w="100%" maxWidth={600}>
        <FadeCard>
          <Card bc="$yellow2" br="$4" p="$3" w="100%">
            <XStack gap="$2" ai="flex-start">
              <AlertTriangle size="$1" color="$yellow10" flexShrink={0} mt="$0.5" />
              <YStack gap="$1" f={1}>
                <Paragraph color="$yellow11" size="$3" fontWeight="600">
                  {t('check.success.warningTitle')}
                </Paragraph>
                <Paragraph color="$yellow10" size="$2">
                  {t('check.success.warningDescription')}
                </Paragraph>
              </YStack>
            </XStack>
          </Card>

          <XStack ai="center" gap="$3">
            <IconCoin symbol={checkCreated.symbol} size="$3" />
            <Paragraph color="$color12" fontWeight="600" fontSize="$8">
              {checkCreated.amount} {checkCreated.symbol}
            </Paragraph>
          </XStack>

          <YStack ai="center" py="$2">
            <QRCode
              value={checkCreated.claimUrl}
              size={200}
              centerComponent={<IconSend size="$4" />}
            />
          </YStack>

          <PrimaryButton onPress={copyLinkToClipboard}>
            <PrimaryButton.Icon>
              {copiedLink ? <Check size={16} color="$black" /> : <Copy size={16} color="$black" />}
            </PrimaryButton.Icon>
            <PrimaryButton.Text>{copiedLink ? 'Copied!' : 'Copy Link'}</PrimaryButton.Text>
          </PrimaryButton>

          <Button
            size="$5"
            w="100%"
            disabled={!hasCopiedLink}
            disabledStyle={{ opacity: 0.5 }}
            onPress={() => router.push('/check')}
            bc="$gray4"
            bw={0}
          >
            <Button.Text color="$color12">Done</Button.Text>
          </Button>
        </FadeCard>
      </YStack>
    )
  }

  // Create check form
  return (
    <YStack f={1} gap="$5" w="100%" maxWidth={600}>
      <FormProvider {...form}>
        <FadeCard>
          <YStack gap="$2">
            <Label color="$color10" textTransform="uppercase" fontSize="$3">
              {t('check.amount')}
            </Label>
            <XStack ai="center" gap="$3">
              <AmountInput decimals={decimals} hasError={hasInsufficientBalance} />
              <CoinField showAllCoins />
            </XStack>
            {hasInsufficientBalance && (
              <Paragraph color="$error" size="$3">
                Insufficient balance
              </Paragraph>
            )}
            <Paragraph color="$color10" size="$3">
              Balance: {formatUnits(balance, decimals)} {coin?.symbol ?? coinInfo?.symbol ?? ''}
            </Paragraph>
          </YStack>

          <YStack gap="$2">
            <Label color="$color10" textTransform="uppercase" fontSize="$3">
              {t('check.expiration')}
            </Label>
            <ExpirationSelector />
          </YStack>

          <Separator />

          <XStack jc="space-between" ai="center">
            <Paragraph color="$color10" size="$4">
              {t('check.fee')}
            </Paragraph>
            <Paragraph color="$color12" size="$4" fontFamily="$mono">
              {isPreparing ? (
                <Spinner size="small" />
              ) : totalFee !== undefined ? (
                `${formatAmount(formatUnits(totalFee, feeDecimals))} USDC`
              ) : (
                '-'
              )}
            </Paragraph>
          </XStack>

          <PrimaryButton disabled={!canSubmit} onPress={form.handleSubmit(onSubmit)}>
            {isSubmitting ? (
              <Spinner color="$black" />
            ) : (
              <PrimaryButton.Text>{t('check.create')}</PrimaryButton.Text>
            )}
          </PrimaryButton>

          {!checkAddress && (
            <Paragraph color="$color10" size="$3" ta="center">
              SendCheck contract is not deployed on this network.
            </Paragraph>
          )}
        </FadeCard>
      </FormProvider>
    </YStack>
  )
}

function AmountInput({ decimals, hasError }: { decimals: number; hasError: boolean }) {
  const { field } = useController({ name: 'amount' })

  return (
    <Input
      f={1}
      value={field.value}
      onChangeText={(text) => {
        const localized = localizeAmount(text)
        field.onChange(localized)
      }}
      placeholder="0"
      inputMode={decimals > 0 ? 'decimal' : 'numeric'}
      fontSize="$8"
      fontFamily="$mono"
      fontWeight="500"
      color="$color12"
      placeholderTextColor="$color4"
      bw={0}
      br="$4"
      bc="transparent"
      focusStyle={{ outlineWidth: 0 }}
      borderColor={hasError ? '$error' : 'transparent'}
    />
  )
}

function ExpirationSelector() {
  const { field } = useController({ name: 'expiresInDays' })
  const hoverStyles = useHoverStyles()
  const options = [
    { label: '1 day', value: 1 },
    { label: '7 days', value: 7 },
    { label: '14 days', value: 14 },
    { label: '30 days', value: 30 },
  ]

  return (
    <XStack gap="$2" flexWrap="wrap">
      {options.map((option) => {
        const isSelected = Number(field.value) === option.value
        return (
          <Button
            key={option.value}
            size="$3"
            br="$4"
            bw={0}
            bc={isSelected ? hoverStyles.backgroundColor : '$color1'}
            hoverStyle={hoverStyles}
            onPress={() => field.onChange(option.value)}
            pressStyle={{ scale: 0.98 }}
          >
            <Button.Text color="$color12" fontSize="$3">
              {option.label}
            </Button.Text>
          </Button>
        )
      })}
    </XStack>
  )
}

export default CheckSendScreen
