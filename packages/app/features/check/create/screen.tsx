import { Button, Card, Input, Label, Paragraph, Spinner, useAppToast, XStack, YStack } from '@my/ui'
import { Check, Copy, Gift } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/router'
import { useTranslation } from 'react-i18next'
import { FormProvider, useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CoinField } from 'app/features/send/components/SendChat/CoinField'
import { useCoins } from 'app/provider/coins'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'
import { formatUnits, type Hex } from 'viem'
import { allCoinsDict } from 'app/data/coins'
import { useState, useCallback, useMemo } from 'react'
import { useSendCheckCreate } from 'app/utils/useSendCheckCreate'
import { useSendAccount } from 'app/utils/send-accounts'
import * as Clipboard from 'expo-clipboard'
import debug from 'debug'

const log = debug('app:features:check:create')

const sendCheckSchema = z.object({
  token: z.string().min(1, 'Token required'),
  amount: z.string().min(1, 'Amount required'),
  expiresInDays: z.number().min(1).max(30).default(7),
})

type SendCheckFormValues = z.infer<typeof sendCheckSchema>

type CheckCreatedState = {
  checkCode: string
  amount: string
  symbol: string
}

export function CheckCreateScreen() {
  const router = useRouter()
  const { t } = useTranslation('send')
  const toast = useAppToast()
  const { coins, isLoading: isLoadingCoins } = useCoins()
  const { data: sendAccount } = useSendAccount()
  const {
    createCheck,
    isPending: isSubmitting,
    isReady: isContractReady,
    checkAddress,
  } = useSendCheckCreate()
  const [checkCreated, setCheckCreated] = useState<CheckCreatedState | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

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

  const coin = coins.find((c) => c.token === token)
  const coinInfo = allCoinsDict[token]
  const decimals = coin?.decimals ?? coinInfo?.decimals ?? 18

  const parsedAmount = amount ? (sanitizeAmount(amount, decimals) ?? 0n) : 0n
  const balance = coin?.balance ?? 0n
  const hasInsufficientBalance = parsedAmount > balance

  const canSubmit =
    !isLoadingCoins &&
    !isSubmitting &&
    parsedAmount > 0n &&
    !hasInsufficientBalance &&
    isContractReady &&
    webauthnCreds.length > 0 &&
    !!checkAddress

  const copyCodeToClipboard = useCallback(async () => {
    if (!checkCreated?.checkCode) return
    await Clipboard.setStringAsync(checkCreated.checkCode)
    setCopiedCode(true)
    toast.show('Code copied!')
    setTimeout(() => setCopiedCode(false), 2000)
  }, [checkCreated?.checkCode, toast])

  const onSubmit = async (values: SendCheckFormValues) => {
    try {
      const checkAmount = sanitizeAmount(values.amount, decimals)
      if (!checkAmount) {
        toast.error('Invalid amount')
        return
      }

      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + values.expiresInDays * 24 * 60 * 60)

      const result = await createCheck({
        tokenAmounts: [{ token: values.token as Hex, amount: checkAmount }],
        expiresAt,
        webauthnCreds,
      })

      setCheckCreated({
        checkCode: result.checkCode,
        amount: values.amount,
        symbol: coin?.symbol ?? 'tokens',
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
        <YStack gap="$4">
          <XStack ai="center" gap="$3">
            <XStack
              w="$4"
              h="$4"
              br="$10"
              ai="center"
              jc="center"
              bc="$primary"
              $theme-light={{ bc: '$color12' }}
            >
              <Check size="$1.5" color="$color1" />
            </XStack>
            <YStack>
              <Paragraph color="$color12" fontWeight="600" fontSize="$5">
                Check Created!
              </Paragraph>
              <Paragraph color="$color10" size="$3">
                Share the code to claim {checkCreated.amount} {checkCreated.symbol}
              </Paragraph>
            </YStack>
          </XStack>
        </YStack>

        <Card padded elevation={1} br="$5" w="100%">
          <YStack gap="$3">
            <XStack ai="center" gap="$2">
              <Gift size="$1" color="$color10" />
              <Paragraph color="$color10" size="$3">
                Check Code
              </Paragraph>
            </XStack>
            <Paragraph
              color="$color12"
              fontSize="$4"
              fontFamily="$mono"
              fontWeight="600"
              selectable
            >
              {checkCreated.checkCode}
            </Paragraph>
          </YStack>
        </Card>

        <Button
          size="$5"
          onPress={copyCodeToClipboard}
          bc="$primary"
          $theme-light={{ bc: '$color12' }}
        >
          <Button.Icon>{copiedCode ? <Check size="$1" /> : <Copy size="$1" />}</Button.Icon>
          <Button.Text color="$color1" fontWeight="600">
            {copiedCode ? 'Copied!' : 'Copy Code'}
          </Button.Text>
        </Button>

        <Button size="$5" variant="outlined" onPress={() => router.push('/check')}>
          <Button.Text>Done</Button.Text>
        </Button>
      </YStack>
    )
  }

  // Create check form
  return (
    <YStack f={1} gap="$5" w="100%" maxWidth={600}>
      <FormProvider {...form}>
        <YStack gap="$5">
          <Card padded elevation={1} br="$5" gap="$5">
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
          </Card>

          <Button
            size="$5"
            disabled={!canSubmit}
            onPress={form.handleSubmit(onSubmit)}
            bc="$primary"
            $theme-light={{ bc: '$color12' }}
            disabledStyle={{ opacity: 0.5 }}
          >
            {isSubmitting ? (
              <Spinner color="$color1" />
            ) : (
              <Button.Text color="$color1" fontWeight="600">
                {t('check.create')}
              </Button.Text>
            )}
          </Button>

          {!checkAddress && (
            <Paragraph color="$color10" size="$3" ta="center">
              SendCheck contract is not deployed on this network.
            </Paragraph>
          )}
        </YStack>
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
  const options = [
    { label: '1 day', value: 1 },
    { label: '7 days', value: 7 },
    { label: '14 days', value: 14 },
    { label: '30 days', value: 30 },
  ]

  return (
    <XStack gap="$2" flexWrap="wrap">
      {options.map((option) => (
        <Button
          key={option.value}
          size="$3"
          br="$4"
          bc={field.value === option.value ? '$primary' : '$color3'}
          $theme-light={{
            bc: field.value === option.value ? '$color12' : '$gray3',
          }}
          onPress={() => field.onChange(option.value)}
          pressStyle={{ scale: 0.98 }}
        >
          <Button.Text color={field.value === option.value ? '$color1' : '$color12'} fontSize="$3">
            {option.label}
          </Button.Text>
        </Button>
      ))}
    </XStack>
  )
}

export default CheckCreateScreen
