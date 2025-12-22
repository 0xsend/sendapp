import {
  Button,
  Card,
  Dialog,
  FadeCard,
  Input,
  Label,
  Paragraph,
  PrimaryButton,
  QRCode,
  Separator,
  Sheet,
  Spinner,
  useAppToast,
  XStack,
  YStack,
} from '@my/ui'
import { AlertTriangle, Check, Copy, HelpCircle } from '@tamagui/lucide-icons'
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
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { hexToBytea } from 'app/utils/hexToBytea'
import { MAX_NOTE_LENGTH } from 'app/components/FormFields/NoteField'
import debug from 'debug'

const log = debug('app:features:check:send')

const sendCheckSchema = z.object({
  token: z.string().min(1, 'Token required'),
  amount: z.string().min(1, 'Amount required'),
  expiresInDays: z.number().min(1).max(30).default(7),
  note: z
    .string()
    .trim()
    .max(MAX_NOTE_LENGTH, `Note cannot exceed ${MAX_NOTE_LENGTH} characters`)
    .optional()
    .default(''),
})

type SendCheckFormValues = z.infer<typeof sendCheckSchema>

type CheckCreatedState = {
  claimUrl: string
  amount: string
  symbol: string
  note?: string
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

  const supabase = useSupabase()

  const form = useForm<SendCheckFormValues>({
    resolver: zodResolver(sendCheckSchema),
    defaultValues: {
      token: usdcAddress[baseMainnet.id],
      amount: '',
      expiresInDays: 30,
      note: '',
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

      // Save note if provided (fire and forget - don't block on this)
      const trimmedNote = values.note?.trim()
      if (trimmedNote) {
        supabase
          .from('send_check_notes')
          .insert({
            ephemeral_address: hexToBytea(result.ephemeralKeyPair.address),
            chain_id: baseMainnet.id,
            note: trimmedNote,
          })
          .then(({ error }) => {
            if (error) {
              log('Failed to save check note:', error)
            }
          })
      }

      setCheckCreated({
        claimUrl: result.claimUrl,
        amount: values.amount,
        symbol: coin?.symbol ?? coinInfo?.symbol ?? 'tokens',
        note: trimmedNote,
      })
    } catch (error) {
      log('Failed to create check:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create check')
    }
  }

  // Success state after creating a check
  if (checkCreated) {
    return (
      <YStack gap="$5" w="100%" maxWidth={600}>
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
            <Paragraph color="$color12" fontWeight="600" fontSize="$8" lineHeight="$8">
              {checkCreated.amount} {checkCreated.symbol}
            </Paragraph>
          </XStack>

          {checkCreated.note && (
            <Card bc="$color2" br="$4" p="$3" w="100%">
              <Paragraph color="$color11" size="$3" fontStyle="italic">
                "{checkCreated.note}"
              </Paragraph>
            </Card>
          )}

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
    <YStack gap="$5" w="100%" maxWidth={600}>
      <FormProvider {...form}>
        <FadeCard>
          <XStack jc="flex-end" position="absolute" top="$4" right="$4" zIndex={1}>
            <SendCheckInfo />
          </XStack>
          <YStack gap="$2">
            <Label color="$color10" textTransform="uppercase" fontSize="$3">
              {t('check.amount')}
            </Label>
            <XStack ai="center" gap="$3" position="relative" mb="$2">
              <AmountInput decimals={decimals} hasError={hasInsufficientBalance} />
              <CoinField showAllCoins />
              <XStack
                position="absolute"
                bottom={-8}
                left={0}
                right={0}
                height={1}
                backgroundColor={'$darkGrayTextField'}
                $theme-light={{
                  backgroundColor: '$silverChalice',
                }}
              />
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

          <YStack gap="$2">
            <Label color="$color10" textTransform="uppercase" fontSize="$3">
              {t('check.note', 'Note (Optional)')}
            </Label>
            <NoteInput />
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

function NoteInput() {
  const { field, fieldState } = useController({ name: 'note' })
  const { t } = useTranslation('send')

  return (
    <YStack gap="$1">
      <Input
        value={field.value}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        placeholder={t('check.notePlaceholder', 'Add a message for the recipient...')}
        placeholderTextColor="$color4"
        fontSize="$4"
        color="$color12"
        bc="$color2"
        bw={1}
        boc={fieldState.error ? '$error' : '$color4'}
        br="$4"
        p="$3"
        multiline
        numberOfLines={4}
        maxLength={MAX_NOTE_LENGTH}
        focusStyle={{
          boc: '$color12',
        }}
      />
      <XStack jc="space-between">
        {fieldState.error ? (
          <Paragraph color="$error" size="$2">
            {fieldState.error.message}
          </Paragraph>
        ) : (
          <Paragraph color="$color8" size="$2">
            {t('check.noteHint', 'Visible to the recipient')}
          </Paragraph>
        )}
        <Paragraph color="$color8" size="$2">
          {field.value?.length ?? 0}/{MAX_NOTE_LENGTH}
        </Paragraph>
      </XStack>
    </YStack>
  )
}

function SendCheckInfo() {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation('send')
  const steps = t('check.info.steps', { returnObjects: true }) as string[]

  const dialogContent = (
    <YStack gap="$3">
      <Paragraph fontWeight="600" size="$5">
        {t('check.info.title')}
      </Paragraph>
      <Paragraph size="$3" lineHeight={20} color="$color11">
        {t('check.info.description')}
      </Paragraph>
      <YStack gap="$2.5" mt="$1">
        <Paragraph size="$3" fontWeight="600">
          {t('check.info.howItWorks')}
        </Paragraph>
        {steps.map((step, index) => (
          <XStack key={step} gap="$2" ai="flex-start">
            <XStack w="$1" h="$1" br="$10" bc="$primary" ai="center" jc="center" mt="$0.5">
              <Paragraph size="$1" color="$black" fontWeight="600">
                {index + 1}
              </Paragraph>
            </XStack>
            <Paragraph size="$3" color="$color11" f={1}>
              {step}
            </Paragraph>
          </XStack>
        ))}
      </YStack>
      <Paragraph size="$2" color="$color10" fontStyle="italic" mt="$2">
        {t('check.info.note')}
      </Paragraph>
    </YStack>
  )

  return (
    <Dialog modal open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <XStack
          ai="center"
          jc="center"
          w="$2.5"
          h="$2.5"
          br="$10"
          bc="$color3"
          cursor="pointer"
          hoverStyle={{ bc: '$color4' }}
        >
          <HelpCircle size={16} color="$color11" />
        </XStack>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ y: -10, opacity: 0 }}
          exitStyle={{ y: -10, opacity: 0 }}
          padding="$4"
          maxWidth={360}
        >
          {dialogContent}
        </Dialog.Content>
      </Dialog.Portal>

      <Dialog.Adapt platform="native">
        <Dialog.Sheet
          modal
          dismissOnSnapToBottom
          dismissOnOverlayPress
          native
          snapPoints={['fit']}
          snapPointsMode="fit"
        >
          <Dialog.Sheet.Frame key="send-check-info-sheet" gap="$3" padding="$4">
            <Dialog.Adapt.Contents />
          </Dialog.Sheet.Frame>
          <Sheet.Overlay
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        </Dialog.Sheet>
      </Dialog.Adapt>
    </Dialog>
  )
}

export default CheckSendScreen
