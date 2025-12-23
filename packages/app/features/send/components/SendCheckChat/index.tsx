import type React from 'react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  Button,
  Card,
  Input as InputOG,
  GorhomSheetInput,
  Paragraph,
  Portal,
  PrimaryButton,
  QRCode,
  Shimmer,
  SizableText,
  Spinner,
  useAppToast,
  useControllableState,
  useMedia,
  usePresence,
  useThemeName,
  View,
  type ViewProps,
  XStack,
  YStack,
} from '@my/ui'
import type BottomSheet from '@gorhom/bottom-sheet'
import { formatUnits, type Hex } from 'viem'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Check, Copy, FileSignature, HelpCircle, X } from '@tamagui/lucide-icons'
import { isWeb } from '@tamagui/constants'
import * as Clipboard from 'expo-clipboard'

import { allCoinsDict } from 'app/data/coins'
import { IconCoin, IconSend } from 'app/components/icons'
import formatAmount, { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'
import { formFields } from 'app/utils/SchemaForm'
import { CoinField } from '../SendChat/CoinField'
import { useCoin, useCoins } from 'app/provider/coins'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSendCheckCreate, type TokenAmount } from 'app/utils/useSendCheckCreate'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { hexToBytea } from 'app/utils/hexToBytea'
import { MAX_NOTE_LENGTH } from 'app/components/FormFields/NoteField'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { SendModalContainer, ReviewSendAmountBox, ReviewSendDetailsRow, NoteInput } from '../shared'
import { useTranslation } from 'react-i18next'

import debug from 'debug'

const log = debug('app:features:send:SendCheckChat')

const Input = (isWeb ? InputOG : GorhomSheetInput) as unknown as typeof InputOG

type Sections = 'enterAmount' | 'reviewAndSend' | 'success'

const SendCheckSchema = z.object({
  amount: formFields.text,
  token: formFields.coin,
  note: z
    .string()
    .trim()
    .max(MAX_NOTE_LENGTH, `Note cannot exceed ${MAX_NOTE_LENGTH} characters`)
    .optional()
    .default(''),
  expiresInDays: z.number().min(1).max(365).default(30),
})

type SendCheckFormValues = z.infer<typeof SendCheckSchema>

type CheckCreatedState = {
  claimUrl: string
  amount: string
  symbol: string
  note?: string
}

interface SendCheckChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SendCheckChat = memo(
  ({ open: openProp, onOpenChange: onOpenChangeProp }: SendCheckChatProps) => {
    const { gtLg } = useMedia()

    const [open, setOpen] = useControllableState({
      defaultProp: false,
      prop: openProp,
      onChange: onOpenChangeProp,
    })

    const [activeSection, setActiveSection] = useState<Sections>('enterAmount')
    const [checkCreated, setCheckCreated] = useState<CheckCreatedState | null>(null)
    const [showInfo, setShowInfo] = useState(false)
    const bottomSheetRef = useRef<BottomSheet>(null)

    useEffect(() => {
      if (open) {
        bottomSheetRef.current?.expand()
      } else {
        bottomSheetRef.current?.close()
      }
    }, [open])

    const handleClose = useCallback(() => {
      setOpen(false)
      bottomSheetRef.current?.close()
      // Reset state after close
      setTimeout(() => {
        setActiveSection('enterAmount')
        setCheckCreated(null)
      }, 300)
    }, [setOpen])

    const animateOnMount = gtLg
      ? ({
          animation: 'responsive',
          animateOnly: ['opacity', 'transform'],
          enterStyle: {
            opacity: 0,
            scale: 0.98,
            x: 100,
          },
          exitStyle: {
            opacity: 0,
            scale: 0.98,
            x: 100,
          },
        } as ViewProps)
      : {}

    const sectionHeight = useMemo(() => {
      if (activeSection === 'success') return 600
      if (activeSection === 'reviewAndSend') return 480
      // enterAmount: 500 (like SendChat) + ~60 for expiration selector
      return 560
    }, [activeSection])

    return (
      <>
        <Portal zIndex={10}>
          <SendModalContainer bottomSheetRef={bottomSheetRef} open={open} setOpen={setOpen}>
            <AnimatePresence>
              {(open || !gtLg) && (
                <View
                  w={700}
                  mih="100%"
                  maw="95%"
                  pe="auto"
                  jc="flex-end"
                  f={1}
                  {...animateOnMount}
                >
                  <YStack
                    animation="responsive"
                    h={sectionHeight}
                    animateOnly={['height']}
                    mah="100%"
                  >
                    <YStack
                      br="$6"
                      elevation="$9"
                      shadowOpacity={0.4}
                      ov="hidden"
                      f={1}
                      bg="$color1"
                    >
                      <SendCheckHeader
                        onClose={handleClose}
                        onInfoPress={() => setShowInfo(true)}
                        zi={2}
                      />
                      <View f={1} ov="hidden">
                        <AnimatePresence exitBeforeEnter>
                          {showInfo ? (
                            <SendCheckInfoCard
                              key="info-card"
                              onContinue={() => setShowInfo(false)}
                            />
                          ) : (
                            <YStack
                              key="main-card"
                              f={1}
                              animation="medium"
                              opacity={1}
                              enterStyle={{ opacity: 0 }}
                              exitStyle={{ opacity: 0 }}
                            >
                              <SendCheckContent
                                activeSection={activeSection}
                                setActiveSection={setActiveSection}
                                checkCreated={checkCreated}
                                setCheckCreated={setCheckCreated}
                                onClose={handleClose}
                              />
                            </YStack>
                          )}
                        </AnimatePresence>
                      </View>
                    </YStack>
                  </YStack>
                </View>
              )}
            </AnimatePresence>
          </SendModalContainer>
          <AnimatePresence>
            {open && (
              <View
                pe="auto"
                cursor="pointer"
                onPress={handleClose}
                animation="200ms"
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
                bg="$shadowColor"
                pos="absolute"
                inset={0}
                zi={-1}
              />
            )}
          </AnimatePresence>
        </Portal>
      </>
    )
  }
)

SendCheckChat.displayName = 'SendCheckChat'

interface SendCheckHeaderProps {
  onClose: () => void
  onInfoPress: () => void
}

const SendCheckHeader = XStack.styleable<SendCheckHeaderProps>(
  ({ onClose, onInfoPress, ...props }) => {
    const { t } = useTranslation('send')

    return (
      <XStack
        gap="$3"
        ai="center"
        p="$4"
        bg="$aztec1"
        bbw={1}
        bbc="$gray3"
        $theme-dark={{ bg: '$aztec4', bbc: '$aztec3' }}
        {...props}
      >
        <XStack ai="center" jc="center" w="$4.5" h="$4.5" br="$10" bg="$primary">
          <FileSignature size={24} color="$black" />
        </XStack>
        <YStack gap="$1.5" f={1}>
          <SizableText size="$4" color="$gray12" fow="500">
            {t('check.title', 'Send Check')}
          </SizableText>
          <SizableText size="$3" color="$gray10">
            {t('check.subtitle', 'Create a shareable link')}
          </SizableText>
        </YStack>
        <XStack ai="center" gap="$2" pos="absolute" r={0} t={0} x={-9} y={10}>
          <Button
            size="$3"
            circular
            animation="100ms"
            animateOnly={['transform']}
            boc="$aztec3"
            hoverStyle={{ boc: '$aztec4' }}
            pressStyle={{ boc: '$aztec4', scale: 0.9 }}
            onPress={onInfoPress}
          >
            <Button.Icon scaleIcon={1.2}>
              <HelpCircle size={16} />
            </Button.Icon>
          </Button>
          <Button
            size="$3"
            circular
            animation="100ms"
            animateOnly={['transform']}
            boc="$aztec3"
            hoverStyle={{ boc: '$aztec4' }}
            pressStyle={{ boc: '$aztec4', scale: 0.9 }}
            onPress={onClose}
          >
            <Button.Icon scaleIcon={1.2}>
              <X />
            </Button.Icon>
          </Button>
        </XStack>
      </XStack>
    )
  }
)

interface SendCheckContentProps {
  activeSection: Sections
  setActiveSection: React.Dispatch<React.SetStateAction<Sections>>
  checkCreated: CheckCreatedState | null
  setCheckCreated: React.Dispatch<React.SetStateAction<CheckCreatedState | null>>
  onClose: () => void
}

const SendCheckContent = ({
  activeSection,
  setActiveSection,
  checkCreated,
  setCheckCreated,
  onClose,
}: SendCheckContentProps) => {
  const { t } = useTranslation('send')
  const toast = useAppToast()
  const supabase = useSupabase()

  const { coins, isLoading: isLoadingCoins } = useCoins()
  const { data: sendAccount } = useSendAccount()
  const {
    query: { data: prices, isLoading: isPricesLoading },
  } = useTokenPrices()

  const webauthnCreds = useMemo(
    () =>
      sendAccount?.send_account_credentials
        ?.filter((c) => !!c.webauthn_credentials)
        ?.map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? [],
    [sendAccount?.send_account_credentials]
  )

  const form = useForm<SendCheckFormValues>({
    resolver: zodResolver(SendCheckSchema),
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

  const { coin } = useCoin(token || usdcAddress[baseMainnet.id])
  const coinInfo = allCoinsDict[token]
  const decimals = coin?.decimals ?? coinInfo?.decimals ?? 18

  const parsedAmount = amount ? (sanitizeAmount(amount, decimals) ?? 0n) : 0n
  const balance = coin?.balance ?? 0n
  const hasInsufficientBalance = parsedAmount > balance

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

  const totalFee = usdcFees ? usdcFees.baseFee + usdcFees.gasFees : undefined

  const canSubmit =
    !isLoadingCoins &&
    !isSubmitting &&
    !isPreparing &&
    parsedAmount > 0n &&
    !hasInsufficientBalance &&
    isReady &&
    webauthnCreds.length > 0 &&
    !!checkAddress

  const price = prices?.[token] ?? 0
  const amountInUSD = price * Number(formatUnits(parsedAmount, decimals))

  const localizedAmount = localizeAmount(formatUnits(parsedAmount, decimals))

  const [present] = usePresence()
  const [loadingSend, setLoadingSend] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [hasCopiedLink, setHasCopiedLink] = useState(false)

  const copyLinkToClipboard = useCallback(async () => {
    if (!checkCreated?.claimUrl) return
    await Clipboard.setStringAsync(checkCreated.claimUrl)
    setCopiedLink(true)
    setHasCopiedLink(true)
    toast.show(t('check.linkCopied', 'Link copied!'))
    setTimeout(() => setCopiedLink(false), 2000)
  }, [checkCreated?.claimUrl, toast, t])

  async function onSubmit() {
    if (activeSection === 'enterAmount') {
      if (!canSubmit) return
      setActiveSection('reviewAndSend')
    } else if (activeSection === 'reviewAndSend') {
      if (!canSubmit) return
      try {
        setLoadingSend(true)
        const values = form.getValues()
        const result = await createCheck({ webauthnCreds })

        // Save note if provided (fire and forget)
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
        setActiveSection('success')
      } catch (error) {
        log('Failed to create check:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to create check')
      } finally {
        setLoadingSend(false)
      }
    }
  }

  const isSendButtonDisabled =
    loadingSend || (activeSection === 'enterAmount' ? !canSubmit : !canSubmit)

  if (activeSection === 'success' && checkCreated) {
    return (
      <SuccessSection
        checkCreated={checkCreated}
        copiedLink={copiedLink}
        hasCopiedLink={hasCopiedLink}
        copyLinkToClipboard={copyLinkToClipboard}
        onClose={onClose}
      />
    )
  }

  return (
    <FormProvider {...form}>
      <YStack zi={1} f={1} w="100%" gap="$4" p="$4" jc="space-between">
        <YStack gap="$3.5" f={1}>
          <View
            animation={'responsive'}
            animateOnly={['opacity', 'transform']}
            enterStyle={{
              opacity: 0,
              y: -100,
            }}
            y={present ? 0 : -100}
            o={present ? 1 : 0}
            gap="$2.5"
          >
            <XStack ai="center" w="100%" jc="space-between">
              <SizableText size="$4" fow="500" col="$gray10">
                {t('check.youreSending', "You're Sending")}
              </SizableText>
              {activeSection === 'reviewAndSend' && (
                <Button onPress={() => setActiveSection('enterAmount')} size="$2" chromeless>
                  <Button.Text fos="$5" fow="500" col="$neon10">
                    {t('check.edit', 'Edit')}
                  </Button.Text>
                </Button>
              )}
            </XStack>

            <YStack
              gap="$3.5"
              ai="stretch"
              p="$4"
              br="$4"
              bg="$aztec4"
              $theme-light={{ bg: '$gray2' }}
              animation="responsive"
              animateOnly={['height']}
              jc="center"
            >
              <AnimatePresence exitBeforeEnter>
                {activeSection === 'reviewAndSend' ? (
                  <ReviewSendAmountBox
                    key="review-send-amount-box"
                    localizedAmount={localizedAmount}
                    selectedCoin={coin}
                    amountInUSD={amountInUSD}
                    isPricesLoading={isPricesLoading}
                    isFeesLoading={isPreparing}
                    usdcFees={usdcFees}
                    usdcFeesError={null}
                  >
                    {form.watch('note') && (
                      <ReviewSendDetailsRow
                        label={t('check.note', 'Note')}
                        value={form.watch('note')}
                      />
                    )}
                    <ReviewSendDetailsRow
                      label={t('check.expires', 'Expires')}
                      value={
                        expiresInDays === 1
                          ? t('check.expiry1Day', '1 day')
                          : expiresInDays === 365
                            ? t('check.expiry1Year', '1 year')
                            : t('check.expiryDays', '{{days}} days', { days: expiresInDays })
                      }
                    />
                  </ReviewSendAmountBox>
                ) : (
                  <EnterAmountSection
                    key="enter-amount"
                    form={form}
                    coin={coin}
                    balance={balance}
                    decimals={decimals}
                    hasInsufficientBalance={hasInsufficientBalance}
                    isLoadingCoins={isLoadingCoins}
                  />
                )}
              </AnimatePresence>
            </YStack>
          </View>

          {activeSection === 'enterAmount' && (
            <YStack gap="$3">
              <YStack gap="$2">
                <SizableText size="$3" col="$gray10">
                  {t('check.noteLabel', 'Note')}
                </SizableText>
                <NoteInput
                  control={form.control}
                  error={form.formState.errors.note}
                  placeholder="Add a note..."
                />
              </YStack>
              <ExpirationSelector form={form} />
            </YStack>
          )}
        </YStack>

        <Button
          bg="$neon7"
          br="$4"
          animation="responsive"
          animateOnly={['opacity', 'transform']}
          bw={0}
          y={present ? 0 : 100}
          enterStyle={{
            opacity: 0,
            y: 20,
          }}
          hoverStyle={{
            bg: '$neon6',
          }}
          pressStyle={{
            bg: '$neon7',
            scale: 0.98,
          }}
          onPress={() => {
            form.handleSubmit(onSubmit)()
          }}
          ov="hidden"
          disabled={isSendButtonDisabled}
          o={isSendButtonDisabled ? 0.5 : 1}
        >
          <AnimatePresence>
            {loadingSend ? (
              <View
                animation="responsive"
                animateOnly={['opacity', 'transform']}
                pos="absolute"
                enterStyle={{
                  opacity: 0,
                  y: -40,
                }}
                exitStyle={{
                  opacity: 0,
                  y: 40,
                }}
              >
                <Spinner size="small" color="$gray1Dark" />
              </View>
            ) : (
              <Button.Text
                fos="$5"
                col="$gray1"
                $theme-light={{ col: '$gray12' }}
                pos="absolute"
                animation="responsive"
                animateOnly={['opacity', 'transform']}
                enterStyle={{
                  opacity: 0,
                  y: -40,
                }}
                exitStyle={{
                  opacity: 0,
                  y: 40,
                }}
              >
                {activeSection === 'reviewAndSend'
                  ? t('check.create', 'Create Check')
                  : t('check.reviewAndSend', 'Review and Send')}
              </Button.Text>
            )}
          </AnimatePresence>
        </Button>

        {!checkAddress && (
          <Paragraph color="$color10" size="$3" ta="center">
            {t('check.notDeployed', 'SendCheck contract is not deployed on this network.')}
          </Paragraph>
        )}
      </YStack>
    </FormProvider>
  )
}

interface EnterAmountSectionProps {
  form: ReturnType<typeof useForm<SendCheckFormValues>>
  coin: ReturnType<typeof useCoin>['coin']
  balance: bigint
  decimals: number
  hasInsufficientBalance: boolean
  isLoadingCoins: boolean
}

const EnterAmountSection = ({
  form,
  coin,
  balance,
  decimals,
  hasInsufficientBalance,
  isLoadingCoins,
}: EnterAmountSectionProps) => {
  const themeName = useThemeName()
  const [amountInputRef, setAmountInputRef] = useState<InputOG | null>(null)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    if (amountInputRef && isWeb) {
      timeoutId = setTimeout(() => {
        amountInputRef?.focus()
      }, 500)
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [amountInputRef])

  return (
    <>
      <XStack key="enter-amount-box">
        <Controller
          control={form.control}
          name="amount"
          render={({ field: { value, onBlur } }) => (
            <Input
              unstyled
              ref={setAmountInputRef}
              value={value}
              bbw={1.5}
              boc="$gray8"
              fontFamily="$mono"
              col="$gray12"
              placeholderTextColor="$gray11"
              placeholder="0"
              focusStyle={{
                bbc: themeName.includes('dark') ? '$primary' : '$neon8',
              }}
              fontWeight="500"
              inputMode={decimals ? 'decimal' : 'numeric'}
              onChangeText={(amount) => {
                const localizedAmount = localizeAmount(amount)
                form.setValue('amount', localizedAmount)
              }}
              bg="$aztec4"
              $theme-light={{ bg: '$gray2' }}
              onBlur={onBlur}
              w="100%"
              pr="$15"
              allowFontScaling
              fontSize={value?.length > 12 ? 32 : 40}
              lh={55}
              pb="$2"
            />
          )}
        />
        <View pos="absolute" t="$2" r={0}>
          <CoinField defaultValue={coin?.token} showAllCoins />
        </View>
      </XStack>
      <YStack>
        {isLoadingCoins ? (
          <Shimmer
            componentName="Card"
            bg="$background"
            $theme-light={{ bg: '$background' }}
            w={200}
            h={22}
            br="$1"
          />
        ) : (
          <XStack gap={'$2'}>
            <Paragraph testID="SendCheckBalance" size={'$5'}>
              Balance:
            </Paragraph>
            <Paragraph color="$color12" size={'$5'} fontWeight={'600'}>
              {!balance ? '0' : formatAmount(formatUnits(balance, decimals), 12, 4)}
            </Paragraph>
            {hasInsufficientBalance && (
              <Paragraph color={'$error'} size={'$5'}>
                Insufficient funds
              </Paragraph>
            )}
          </XStack>
        )}
      </YStack>
    </>
  )
}

interface ExpirationSelectorProps {
  form: ReturnType<typeof useForm<SendCheckFormValues>>
}

const ExpirationSelector = ({ form }: ExpirationSelectorProps) => {
  const { t } = useTranslation('send')
  const hoverStyles = useHoverStyles()
  const expiresInDays = form.watch('expiresInDays')

  const options = [
    { label: t('check.expiry1Day', '1 day'), value: 1 },
    { label: t('check.expiry7Days', '7 days'), value: 7 },
    { label: t('check.expiry14Days', '14 days'), value: 14 },
    { label: t('check.expiry30Days', '30 days'), value: 30 },
    { label: t('check.expiry1Year', '1 year'), value: 365 },
  ]

  return (
    <YStack gap="$2">
      <SizableText size="$3" col="$gray10">
        {t('check.expiresIn', 'Expires in')}
      </SizableText>
      <XStack gap="$2" flexWrap="wrap">
        {options.map((option) => {
          const isSelected = Number(expiresInDays) === option.value
          return (
            <Button
              key={option.value}
              size="$3"
              br="$4"
              bw={0}
              bc={isSelected ? hoverStyles.backgroundColor : '$color1'}
              hoverStyle={hoverStyles}
              onPress={() => form.setValue('expiresInDays', option.value)}
              pressStyle={{ scale: 0.98 }}
            >
              <Button.Text color="$color12" fontSize="$3">
                {option.label}
              </Button.Text>
            </Button>
          )
        })}
      </XStack>
    </YStack>
  )
}

interface SuccessSectionProps {
  checkCreated: CheckCreatedState
  copiedLink: boolean
  hasCopiedLink: boolean
  copyLinkToClipboard: () => Promise<void>
  onClose: () => void
}

const SuccessSection = ({
  checkCreated,
  copiedLink,
  hasCopiedLink,
  copyLinkToClipboard,
  onClose,
}: SuccessSectionProps) => {
  const { t } = useTranslation('send')

  return (
    <YStack gap="$4" p="$4" f={1}>
      <Card bc="$yellow2" br="$4" p="$3" w="100%">
        <XStack gap="$2" ai="flex-start">
          <AlertTriangle size="$1" color="$yellow10" flexShrink={0} mt="$0.5" />
          <YStack gap="$1" f={1}>
            <Paragraph color="$yellow11" size="$3" fontWeight="600">
              {t('check.success.warningTitle', 'Keep this link safe')}
            </Paragraph>
            <Paragraph color="$yellow10" size="$2">
              {t(
                'check.success.warningDescription',
                'Anyone with this link can claim these funds. Only share with the intended recipient.'
              )}
            </Paragraph>
          </YStack>
        </XStack>
      </Card>

      <XStack ai="center" gap="$3" jc="center">
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
        <QRCode value={checkCreated.claimUrl} size={160} centerComponent={<IconSend size="$3" />} />
      </YStack>

      <PrimaryButton onPress={copyLinkToClipboard}>
        <PrimaryButton.Icon>
          {copiedLink ? <Check size={16} color="$black" /> : <Copy size={16} color="$black" />}
        </PrimaryButton.Icon>
        <PrimaryButton.Text>
          {copiedLink ? t('check.copied', 'Copied!') : t('check.copyLink', 'Copy Link')}
        </PrimaryButton.Text>
      </PrimaryButton>

      <Button
        size="$5"
        w="100%"
        disabled={!hasCopiedLink}
        disabledStyle={{ opacity: 0.5 }}
        onPress={onClose}
        bc="$gray4"
        bw={0}
      >
        <Button.Text color="$color12">{t('check.done', 'Done')}</Button.Text>
      </Button>
    </YStack>
  )
}

interface SendCheckInfoCardProps {
  onContinue: () => void
}

const SendCheckInfoCard = ({ onContinue }: SendCheckInfoCardProps) => {
  const { t } = useTranslation('send')
  const steps = t('check.info.steps', { returnObjects: true }) as string[]

  return (
    <YStack
      f={1}
      animation="medium"
      animateOnly={['transform', 'opacity']}
      y={0}
      opacity={1}
      enterStyle={{ y: 300, opacity: 0 }}
      exitStyle={{ y: 300, opacity: 0 }}
    >
      <YStack f={1} p="$4" gap="$4" jc="space-between">
        <YStack gap="$3">
          <XStack gap="$2" ai="center">
            <HelpCircle size={20} color="$primary" />
            <Paragraph fontWeight="600" size="$5" color="$gray12">
              {t('check.info.title', 'What is Send Check?')}
            </Paragraph>
          </XStack>
          <Paragraph size="$3" lineHeight={20} color="$color11">
            {t('check.info.description')}
          </Paragraph>
          <YStack gap="$2.5" mt="$1">
            <Paragraph size="$3" fontWeight="600">
              {t('check.info.howItWorks')}
            </Paragraph>
            {Array.isArray(steps) &&
              steps.map((step, index) => (
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

        <Button
          bg="$neon7"
          br="$4"
          bw={0}
          hoverStyle={{ bg: '$neon6' }}
          pressStyle={{ bg: '$neon7', scale: 0.98 }}
          onPress={onContinue}
        >
          <Button.Text fos="$5" col="$gray1" $theme-light={{ col: '$gray12' }}>
            {t('check.info.dismiss', 'Got it')}
          </Button.Text>
        </Button>
      </YStack>
    </YStack>
  )
}

export default SendCheckChat
