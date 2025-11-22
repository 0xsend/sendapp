import type React from 'react'
import { useCallback, useState, useRef, useMemo, useEffect, type PropsWithChildren } from 'react'
import {
  AnimatePresence,
  Avatar,
  Button,
  createStyledContext,
  LinearGradient,
  Link,
  Paragraph,
  Portal,
  type ScrollView,
  Shimmer,
  SizableText,
  Spinner,
  styled,
  Text,
  useAppToast,
  useControllableState,
  useDebounce,
  useMedia,
  usePresence,
  useSafeAreaInsets,
  useThemeName,
  useWindowDimensions,
  View,
  XStack,
  YStack,
  GorhomSheetInput,
  Input as InputOG,
  type ViewProps,
} from '@my/ui'

import BottomSheet from '@gorhom/bottom-sheet'
import { BottomSheetView } from '@gorhom/bottom-sheet'

import { formatUnits, isAddress } from 'viem'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { allCoins, allCoinsDict, type CoinWithBalance } from 'app/data/coins'
import { IconBadgeCheckSolid2, IconCoin, IconEthereum } from 'app/components/icons'
import formatAmount, { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'
import { History, X } from '@tamagui/lucide-icons'
import { useSendScreenParams } from 'app/routers/params'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { shorten } from 'app/utils/strings'
import { isAndroid, isWeb } from '@tamagui/constants'
import { useCoinFromSendTokenParam } from 'app/utils/useCoinFromTokenParam'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { formFields } from 'app/utils/SchemaForm'
import { zodResolver } from '@hookform/resolvers/zod'
import { CoinField } from './CoinField'
import { useCoin, useCoins } from 'app/provider/coins'
import { MAX_NOTE_LENGTH } from 'app/components/FormFields/NoteField'
import { assert } from 'app/utils/assert'
import { useSendAccount } from 'app/utils/send-accounts'
import { useUser } from 'app/utils/useUser'
import { api } from 'app/utils/api'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { useAccountNonce } from 'app/utils/userop'
import { useGenerateTransferUserOp } from 'app/utils/useUserOpTransferMutation'
import { useUSDCFees } from 'app/utils/useUSDCFees'
import { useEstimateFeesPerGas } from 'wagmi'
import { baseMainnet, baseMainnetClient, entryPointAddress } from '@my/wagmi'
import { FlatList, KeyboardAvoidingView } from 'react-native'
import { throwIf } from 'app/utils/throwIf'

import debug from 'debug'
import { signUserOp } from 'app/utils/signUserOp'
import type { UserOperation } from 'permissionless'
import { decodeTransferUserOp } from 'app/utils/decodeTransferUserOp'
import { useInterUserActivityFeed } from 'app/features/profile/utils/useInterUserActivityFeed'

const log = debug('app:features:send:confirm:screen')

type Sections = 'chat' | 'enterAmount' | 'reviewAndSend'

const SendChatContext = createStyledContext<{
  activeSection: Sections
  setActiveSection: React.Dispatch<React.SetStateAction<Sections>>
  setTransaction: React.Dispatch<React.SetStateAction<Activity | undefined>>
  transaction: Activity | undefined
}>({
  activeSection: 'chat',
  setActiveSection: () => {},
  setTransaction: () => {},
  transaction: undefined,
})

interface SendChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const Input = (isWeb ? InputOG : GorhomSheetInput) as unknown as typeof InputOG

export const SendChat = ({ open: openProp, onOpenChange: onOpenChangeProp }: SendChatProps) => {
  const { height } = useWindowDimensions()

  const { gtLg } = useMedia()

  const [open, setOpen] = useControllableState({
    defaultProp: false,
    prop: openProp,
    onChange: onOpenChangeProp,
  })

  const [transaction, setTransaction] = useState<Activity>()

  const [activeSection, setActiveSection] = useState<Sections>('chat')
  const bottomSheetRef = useRef<BottomSheet>(null)

  useEffect(() => {
    if (open) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [open])

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

  return (
    <>
      <Portal zIndex={10}>
        <Container open={open} setOpen={setOpen}>
          <SendChatContext.Provider
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            setTransaction={setTransaction}
            transaction={transaction}
          >
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
                    h={
                      activeSection === 'chat'
                        ? height
                        : activeSection === 'enterAmount'
                          ? 500
                          : 570
                    }
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
                      <SendChatHeader
                        onClose={() => {
                          if (activeSection === 'chat') {
                            setOpen(false)
                          } else {
                            setActiveSection('chat')
                          }
                        }}
                        zi={2}
                      />
                      <ChatList />
                      <SendChatInput />

                      <AnimatePresence>
                        {activeSection !== 'chat' && <EnterAmountNoteSection key="enterAmount" />}
                      </AnimatePresence>
                    </YStack>
                  </YStack>
                </View>
              )}
            </AnimatePresence>
          </SendChatContext.Provider>
        </Container>
        <AnimatePresence>
          {open && (
            <View
              pe="auto"
              cursor="pointer"
              onPress={() => setOpen(false)}
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
      <Transaction
        open={!!transaction}
        onClose={() => setTransaction(undefined)}
        transaction={transaction}
      />
    </>
  )
}

interface ContainerProps {
  children: React.ReactNode
  open: boolean
  setOpen: (open: boolean) => void
}

const Container = ({ children, open, setOpen }: ContainerProps) => {
  const { lg } = useMedia()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const { bottom, top } = useSafeAreaInsets()

  useEffect(() => {
    if (open) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [open])

  if (lg) {
    return (
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        snapPoints={['95%']}
        style={{ backgroundColor: 'transparent' }}
        enableDynamicSizing={false}
        enablePanDownToClose
        detached
        onClose={() => {
          setOpen(false)
        }}
        animationConfigs={{
          damping: 35,
          stiffness: 400,
        }}
        handleComponent={null}
        backgroundStyle={{
          backgroundColor: 'transparent',
        }}
        bottomInset={bottom || 10}
        topInset={top}
        keyboardBehavior="interactive"
      >
        <BottomSheetView
          style={{
            alignItems: 'center',
            justifyContent: 'flex-end',
            flex: 1,
            height: '100%',
          }}
        >
          {children}
        </BottomSheetView>
      </BottomSheet>
    )
  }

  return (
    <View p="$8" jc="center" ai="flex-end" pos="absolute" inset={0} zi={1000}>
      {children}
    </View>
  )
}

interface SendChatHeaderProps {
  onClose: () => void
}

const SendChatHeader = XStack.styleable<SendChatHeaderProps>(({ onClose, ...props }) => {
  const themeName = useThemeName()

  const isDark = themeName.includes('dark')

  const [{ recipient, idType }] = useSendScreenParams()
  const {
    data: profile,
    isLoading,
    error: errorProfileLookup,
  } = useProfileLookup(idType ?? 'tag', recipient ?? '')

  const href = profile ? `/profile/${profile?.sendid}` : ''

  const tagName =
    idType === 'address'
      ? shorten(recipient, 5, 4)
      : profile?.tag
        ? `/${profile?.tag}`
        : `#${profile?.sendid}`

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
      <Link
        hoverStyle={{
          opacity: 0.8,
        }}
        focusStyle={{
          opacity: 0.8,
        }}
        pressStyle={{
          scale: 0.95,
        }}
        href={href}
      >
        <Avatar circular size="$4.5" elevation="$0.75">
          {isAndroid && !profile?.avatar_url ? (
            <Avatar.Image
              src={`https://ui-avatars.com/api/?name=${profile?.name}&size=256&format=png&background=86ad7f`}
            />
          ) : (
            <>
              <Avatar.Image src={profile?.avatar_url ?? ''} />
              <Avatar.Fallback jc="center" bc="$olive">
                <Avatar size="$4.5" circular>
                  <Avatar.Image
                    src={`https://ui-avatars.com/api/?name=${profile?.name}&size=256&format=png&background=86ad7f`}
                  />
                </Avatar>
              </Avatar.Fallback>
            </>
          )}
        </Avatar>
        {profile?.is_verified && (
          <XStack zi={100} pos="absolute" bottom={0} right={0} x="$1" y="$1">
            <XStack pos="absolute" elevation={'$1'} scale={0.5} br={1000} inset={0} />
            <IconBadgeCheckSolid2
              size="$1"
              scale={0.7}
              color="$neon8"
              $theme-dark={{ color: '$neon7' }}
              //@ts-expect-error - checkColor is not typed
              checkColor={isDark ? '#082B1B' : '#fff'}
            />
          </XStack>
        )}
      </Link>
      <YStack gap="$1.5">
        <SizableText size="$4" color="$gray12" fow="500">
          {profile?.name || tagName?.replace('/', '').replace('#', '') || '—-'}
        </SizableText>
        <SizableText size="$3" color="$gray10">
          {tagName}
        </SizableText>
      </YStack>
      <Button
        size="$3"
        circular
        animation="100ms"
        animateOnly={['transform']}
        pos="absolute"
        r={0}
        t={0}
        x={-9}
        y={10}
        boc="$aztec3"
        hoverStyle={{
          boc: '$aztec4',
        }}
        pressStyle={{
          boc: '$aztec4',
          scale: 0.9,
        }}
        onPress={onClose}
      >
        <Button.Icon scaleIcon={1.2}>
          <X />
        </Button.Icon>
      </Button>
    </XStack>
  )
})

const SendChatInput = Input.styleable((props) => {
  const { setActiveSection, activeSection } = SendChatContext.useStyledContext()

  const [message, setMessage] = useState('')
  const inputRef = useRef<InputOG>(null)
  const themeName = useThemeName()

  const gradientColors = useMemo(() => {
    if (themeName.includes('dark')) {
      return ['hsl(190, 40%, 10%, 0.8)', 'hsl(190, 40%, 10%, 0.3)', 'transparent']
    }
    return ['hsl(0, 0%, 92%, 0.5)', 'hsl(0, 0%, 92%, 0.2)', 'transparent']
  }, [themeName])

  return (
    <YStack zi={1}>
      <View
        animation="smoothResponsive"
        animateOnly={['opacity']}
        opacity={activeSection === 'chat' ? 1 : 0}
      >
        <LinearGradient
          // Use the actual aztec3 color value as in line 129
          colors={gradientColors}
          locations={[0, 0.36, 1]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          pointerEvents="none"
          w="100%"
          h={20}
          y={-18}
          pos="absolute"
        />
      </View>
      <YStack w="100%" zi={1}>
        <XStack py="$4" px="$4">
          <View
            animation="responsive"
            animateOnly={['height', 'transform']}
            h={activeSection === 'chat' ? 47 : 80}
            y={activeSection === 'chat' ? 0 : -84}
            f={1}
            tabIndex={0}
            onPress={() => setActiveSection('enterAmount')}
          >
            <Input
              bg="$aztec5"
              $theme-light={{
                bg: '$gray3',
              }}
              numberOfLines={4}
              multiline
              placeholderTextColor="$gray11"
              f={1}
              ref={inputRef}
              autoFocus={false}
              value={message}
              onChangeText={setMessage}
              pointerEvents="none"
              // use a placeholder that trigger the user to send some crypto with a message
              placeholder={
                activeSection === 'chat' ? 'Type amount, add a note...' : 'Add a note...'
              }
              br="$3"
              fos="$5"
              {...props}
            />
          </View>
        </XStack>
      </YStack>
    </YStack>
  )
})

const SendAmountSchema = z.object({
  amount: formFields.text,
  token: formFields.coin,
  note: formFields.note,
})

// all inputs are here
const EnterAmountNoteSection = YStack.styleable((props) => {
  const [sendParams, setSendParams] = useSendScreenParams()

  const { coin } = useCoinFromSendTokenParam()

  const themeName = useThemeName()

  const { isLoading: isLoadingCoins } = useCoins()
  const form = useForm<z.infer<typeof SendAmountSchema>>({
    resolver: zodResolver(SendAmountSchema),
    defaultValues: {
      token: coin?.token,
      amount:
        sendParams.amount && coin !== undefined
          ? localizeAmount(formatUnits(BigInt(sendParams.amount), coin.decimals))
          : undefined,
      note: sendParams.note || '',
    },
  })

  const [present] = usePresence()
  const { setActiveSection, activeSection } = SendChatContext.useStyledContext()

  // copied

  const { recipient, idType } = sendParams
  const { data: profile, isLoading: isProfileLoading } = useProfileLookup(
    idType ?? 'tag',
    recipient ?? ''
  )

  const [isNoteInputFocused, setIsNoteInputFocused] = useState<boolean>(false)
  const amountInputRef = useRef<InputOG>(null)

  const noteValidationError = form.formState.errors.note

  const onFormChange = useDebounce(
    useCallback(
      (values) => {
        const { amount, token: _token, note } = values
        const sendToken = _token as allCoins[number]['token']
        const sanitizedAmount = sanitizeAmount(
          amount,
          allCoinsDict[sendToken]?.decimals
        )?.toString()

        const noteValidation = formFields.note.safeParse(note)
        if (noteValidation.error) {
          form.setError('note', {
            message:
              noteValidation.error.errors[0]?.message ??
              'Note failed to match validation constraints',
          })
        } else {
          form.clearErrors('note')
        }
        setSendParams(
          {
            ...sendParams,
            amount: sanitizedAmount,
            sendToken,
            note: note.trim(),
          },
          { webBehavior: 'replace' }
        )
      },
      [setSendParams, sendParams, form]
    ),
    300,
    { leading: false },
    []
  )

  useEffect(() => {
    const subscription = form.watch(onFormChange)

    return () => {
      subscription.unsubscribe()
      onFormChange.cancel()
    }
  }, [form, onFormChange])

  // Delay keyboard appearance to allow animation to complete
  useEffect(() => {
    if (activeSection === 'enterAmount' && amountInputRef.current) {
      const timeoutId = setTimeout(() => {
        amountInputRef.current?.focus()
      }, 500)

      return () => {
        clearTimeout(timeoutId)
      }
    }
  }, [activeSection])

  const parsedAmount = BigInt(sendParams.amount ?? '0')

  const minXfrAmt = coin?.minXfrAmt
    ? BigInt(Math.floor(coin.minXfrAmt * 10 ** coin.decimals))
    : BigInt(0)

  const belowMinimum =
    coin?.minXfrAmt !== undefined &&
    sendParams.amount !== undefined &&
    parsedAmount > BigInt(0) &&
    parsedAmount < minXfrAmt

  const canSubmitSendReview =
    !isLoadingCoins &&
    coin?.balance !== undefined &&
    sendParams.amount !== undefined &&
    coin.balance >= parsedAmount &&
    parsedAmount > BigInt(0) &&
    !belowMinimum &&
    !noteValidationError

  const insufficientAmount =
    coin?.balance !== undefined && sendParams.amount !== undefined && parsedAmount > coin?.balance

  // new copied  code from send confirm screen

  const queryClient = useQueryClient()
  const [queryParams] = useSendScreenParams()
  const { sendToken, amount, note } = queryParams
  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()
  const { coin: selectedCoin } = useCoinFromSendTokenParam()
  const { profile: currentUserProfile } = useUser()

  const [loadingSend, setLoadingSend] = useState(false)

  // states for auth flow
  const [error, setError] = useState<Error | null>(null)
  const {
    mutateAsync: transfer,
    isPending: isTransferPending,
    isSuccess: isTransferInitialized,
  } = api.temporal.transfer.useMutation()

  const isUSDCSelected = selectedCoin?.label === 'USDC'
  const { coin: usdc } = useCoin('USDC')
  const {
    query: { data: prices, isLoading: isPricesLoading },
  } = useTokenPrices()

  const webauthnCreds =
    sendAccount?.send_account_credentials
      .filter((c) => !!c.webauthn_credentials)
      .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? []

  const {
    data: nonce,
    error: nonceError,
    isLoading: nonceIsLoading,
  } = useAccountNonce({
    sender: sendAccount?.address,
  })

  const { data: userOp, isPending: isGeneratingUserOp } = useGenerateTransferUserOp({
    sender: sendAccount?.address,
    // @ts-expect-error some work to` do here
    to: profile?.address ?? recipient,
    token: sendToken === 'eth' ? undefined : sendToken,
    amount: BigInt(queryParams.amount ?? '0'),
    nonce,
  })

  const { mutateAsync: validateUserOp, isPending: isValidatePending } = useValidateTransferUserOp()

  const {
    data: usdcFees,
    isLoading: isFeesLoading,
    error: usdcFeesError,
  } = useUSDCFees({
    userOp,
  })

  const {
    data: feesPerGas,
    isLoading: isGasLoading,
    error: feesPerGasError,
  } = useEstimateFeesPerGas({
    chainId: baseMainnet.id,
  })

  const toast = useAppToast()

  const hasEnoughBalance = !!selectedCoin?.balance && selectedCoin.balance >= BigInt(amount ?? '0')
  const gas = usdcFees ? usdcFees.baseFee + usdcFees.gasFees : BigInt(Number.MAX_SAFE_INTEGER)
  const hasEnoughGas =
    (usdc?.balance ?? BigInt(0)) > (isUSDCSelected ? BigInt(amount ?? '0') + gas : gas)

  const isLoading =
    nonceIsLoading || isProfileLoading || isSendAccountLoading || isGeneratingUserOp || isGasLoading

  const isSubmitting = isValidatePending || isTransferPending || isTransferInitialized

  const canSubmitSend =
    !isLoading && !isSubmitting && hasEnoughBalance && hasEnoughGas && feesPerGas !== undefined

  const localizedAmountForSendReview = localizeAmount(
    formatUnits(
      BigInt(amount ?? ''),
      selectedCoin?.decimals ?? allCoinsDict[sendToken]?.decimals ?? 0
    )
  )

  const price = prices?.[sendToken] ?? 0
  const amountInUSDForSendReview =
    price *
    Number(
      formatUnits(
        BigInt(amount ?? ''),
        selectedCoin?.decimals ?? allCoinsDict[sendToken]?.decimals ?? 0
      )
    )

  async function onSubmit() {
    if (activeSection === 'enterAmount') {
      if (!canSubmitSendReview) return
      setActiveSection('reviewAndSend')
    } else {
      if (!canSubmitSend) return
      try {
        setLoadingSend(true)
        assert(!!userOp, 'User op is required')
        assert(!!selectedCoin?.balance, 'Balance is not available')
        assert(nonceError === null, `Failed to get nonce: ${nonceError}`)
        assert(nonce !== undefined, 'Nonce is not available')
        throwIf(feesPerGasError)
        assert(!!feesPerGas, 'Fees per gas is not available')
        assert(
          !note || !formFields.note.safeParse(note).error,
          'Note failed to match validation constraints'
        )

        assert(selectedCoin?.balance >= BigInt(amount ?? '0'), 'Insufficient balance')
        const sender = sendAccount?.address as `0x${string}`
        assert(isAddress(sender), 'No sender address')
        const _userOp = {
          ...userOp,
          maxFeePerGas: feesPerGas.maxFeePerGas,
          maxPriorityFeePerGas: feesPerGas.maxPriorityFeePerGas,
        }

        log('gasEstimate', usdcFees)
        log('feesPerGas', feesPerGas)
        log('userOp', _userOp)
        const chainId = baseMainnetClient.chain.id
        const entryPoint = entryPointAddress[chainId]

        const signature = await signUserOp({
          userOp,
          chainId,
          webauthnCreds,
          entryPoint,
        })
        userOp.signature = signature

        const validatedUserOp = await validateUserOp(userOp)
        assert(!!validatedUserOp, 'Operation expected to fail')

        const { workflowId } = await transfer({
          userOp: validatedUserOp,
          ...(note && { note: encodeURIComponent(note) }),
        })

        if (workflowId) {
          // Don't await - fire and forget to avoid iOS hanging on cache operations
          void queryClient.invalidateQueries({
            queryKey: ['activity_feed'],
            exact: false,
          })

          void queryClient.resetQueries({
            queryKey: ['inter_user_activity_feed', profile?.sendid, currentUserProfile?.send_id],
            exact: false,
          })

          setActiveSection('chat')
        }
      } catch (e) {
        // @TODO: handle sending repeated tx when nonce is still pending
        // if (e.message.includes('Workflow execution already started')) {
        //   router.replace({ pathname: '/', query: { token: sendToken } })
        //   return
        // }
        console.error(e)
        setError(e)
        const errorMessage = (e as { details?: string }).details ?? e.message ?? 'Error sending'
        toast.error(errorMessage.split('.').at(0) ?? errorMessage)
        await queryClient.invalidateQueries({ queryKey: [useAccountNonce.queryKey] })
      } finally {
        setLoadingSend(false)
      }
    }
  }

  const isSendButtonDisabled =
    loadingSend || (activeSection === 'enterAmount' ? !canSubmitSendReview : !canSubmitSend)

  return (
    <FormProvider {...form}>
      <YStack
        zi={1}
        pos="absolute"
        bottom={0}
        height={400}
        f={1}
        w="100%"
        gap="$7"
        p="$4"
        jc="flex-end"
        {...props}
        animation="responsive"
        exitStyle={{
          opacity: 0,
          y: 20,
        }}
      >
        <YStack gap="$3.5">
          <View
            animation={[
              'responsive',
              {
                opacity: '100ms',
                transform: 'responsive',
              },
            ]}
            animateOnly={['opacity', 'transform']}
            enterStyle={{
              opacity: 0,
              y: -20,
            }}
            exitStyle={{
              opacity: 0,
              y: -20,
            }}
            gap="$2.5"
          >
            <XStack ai="center" w="100%" jc="space-between">
              <SizableText size="$4" fow="500" col="$gray10">
                You&apos;re Sending
              </SizableText>
              {activeSection === 'reviewAndSend' && (
                <Button onPress={() => setActiveSection('enterAmount')} size="$2" chromeless>
                  <Button.Text fos="$5" fow="500" col="$neon10">
                    Edit
                  </Button.Text>
                </Button>
              )}
            </XStack>
            <YStack
              gap="$3.5"
              ai="stretch"
              p="$6"
              px="$4"
              br="$4"
              bg="$aztec4"
              $theme-light={{ bg: '$gray2' }}
              animation="responsive"
              animateOnly={['height']}
              h={activeSection === 'reviewAndSend' ? 220 : 170}
              jc="center"
            >
              <AnimatePresence exitBeforeEnter>
                {activeSection === 'reviewAndSend' ? (
                  <ReviewSendAmountBox
                    key="review-send-amount-box"
                    localizedAmount={localizedAmountForSendReview}
                    selectedCoin={selectedCoin}
                    amountInUSD={amountInUSDForSendReview}
                    isPricesLoading={isPricesLoading}
                    isFeesLoading={isFeesLoading}
                    usdcFees={usdcFees}
                    usdcFeesError={usdcFeesError}
                  />
                ) : (
                  <>
                    <XStack
                      key="enter-amount-box"
                      animation="100ms"
                      filter="blur(0px)"
                      enterStyle={{
                        opacity: 0,
                        filter: 'blur(4px)',
                      }}
                    >
                      <Controller
                        control={form.control}
                        name="amount"
                        render={({ field: { value, onBlur } }) => (
                          <Input
                            unstyled
                            ref={amountInputRef}
                            value={value}
                            bbw={1.5}
                            boc="$gray8"
                            fontFamily="$mono"
                            col="$gray12"
                            placeholderTextColor="$gray11"
                            placeholder="0.000"
                            focusStyle={{
                              bbc: themeName.includes('dark') ? '$primary' : '$neon8',
                            }}
                            fontWeight="500"
                            inputMode={coin?.decimals ? 'decimal' : 'numeric'}
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
                        <CoinField defaultValue={coin?.token} />
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
                        <XStack
                          gap={'$2'}
                          flexDirection={'column'}
                          $gtSm={{ flexDirection: 'row' }}
                        >
                          <XStack gap={'$2'}>
                            <Paragraph testID="SendFormBalance" size={'$5'}>
                              Balance:
                            </Paragraph>
                            <Paragraph color="$color12" size={'$5'} fontWeight={'600'}>
                              {!coin?.balance
                                ? '0.000'
                                : formatAmount(formatUnits(coin.balance, coin.decimals), 12, 4)}
                            </Paragraph>

                            {insufficientAmount && (
                              <Paragraph color={'$error'} size={'$5'}>
                                Insufficient funds
                              </Paragraph>
                            )}
                            {belowMinimum && coin?.minXfrAmt !== undefined && (
                              <Paragraph color={'$error'} size={'$5'} testID="SendFormMinimumError">
                                Minimum: {formatAmount(coin.minXfrAmt.toString(), 12, 4)}{' '}
                                {coin.symbol}
                              </Paragraph>
                            )}
                          </XStack>
                        </XStack>
                      )}
                    </YStack>
                  </>
                )}
              </AnimatePresence>
            </YStack>
          </View>
          <View
            //@ts-expect-error - delay is not typed in tamagui
            animation={
              present
                ? [
                    '200ms',
                    {
                      delay: 200,
                    },
                  ]
                : null
            }
            // changing animation at runtime require a key change to remount the component and avoid hook errors
            key={present ? 'note-input-enter' : 'note-input-exit'}
            opacity={present ? 1 : 0}
            enterStyle={{
              opacity: 0,
            }}
          >
            <Controller
              name="note"
              control={form.control}
              render={({ field: { value, onChange, onBlur, ...rest } }) => (
                <YStack>
                  <Input
                    {...rest}
                    bg="$aztec5"
                    numberOfLines={4}
                    ai="flex-start"
                    $theme-light={{
                      bg: '$gray3',
                    }}
                    placeholderTextColor="$gray11"
                    disabled={activeSection === 'reviewAndSend'}
                    placeholder="Add a note..."
                    fos="$5"
                    br="$3"
                    multiline
                    value={value}
                    onFocus={() => {
                      setIsNoteInputFocused(true)
                    }}
                    onBlur={() => {
                      onBlur()
                      setIsNoteInputFocused(false)
                    }}
                    onChangeText={onChange}
                  />

                  <Paragraph
                    color={noteValidationError ? '$error' : '$lightGrayTextField'}
                    $theme-light={{ color: '$darkGrayTextField' }}
                    pos="absolute"
                    b={0}
                    y="120%"
                  >
                    {isNoteInputFocused || noteValidationError ? (
                      <>
                        {noteValidationError
                          ? noteValidationError.message
                          : `Max: ${MAX_NOTE_LENGTH} characters`}
                      </>
                    ) : (
                      ''
                    )}
                  </Paragraph>
                </YStack>
              )}
            />
          </View>
        </YStack>
        <Button
          bg="$neon7"
          br="$4"
          animation={[
            'smoothResponsive',
            {
              //@ts-expect-error - delay is not typed in tamagui
              delay: present ? 50 : 0,
            },
          ]}
          animateOnly={['opacity', 'transform']}
          bw={0}
          y={present ? 0 : 20}
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
          onPress={form.handleSubmit(onSubmit)}
          ov="hidden"
          disabled={isSendButtonDisabled}
          o={isSendButtonDisabled ? 0.5 : 1}
        >
          <AnimatePresence>
            {loadingSend ? (
              <View
                animation="responsive"
                animateOnly={['opacity', 'transform']}
                filter="blur(0px)"
                pos="absolute"
                enterStyle={{
                  opacity: 0,
                  y: -40,
                  ...(isWeb && {
                    filter: 'blur(4px)',
                  }),
                }}
                exitStyle={{
                  opacity: 0,
                  y: 40,
                  ...(isWeb && {
                    filter: 'blur(4px)',
                  }),
                }}
              >
                <Spinner size="small" color="$gray1Dark" />
              </View>
            ) : (
              <Button.Text
                key={activeSection === 'reviewAndSend' ? 'review-button-text' : 'send-button-text'}
                fos="$5"
                col="$gray1"
                $theme-light={{ col: '$gray12' }}
                animation="responsive"
                animateOnly={['opacity', 'transform']}
                pos="absolute"
                enterStyle={{
                  opacity: 0,
                  y: -40,
                  ...(isWeb && {
                    filter: 'blur(4px)',
                  }),
                }}
                exitStyle={{
                  opacity: 0,
                  y: 40,
                  ...(isWeb && {
                    filter: 'blur(4px)',
                  }),
                }}
                $platform-web={{
                  filter: 'blur(0px)',
                  willChange: 'transform, opacity, filter',
                  transition: 'filter linear 200ms',
                }}
              >
                {activeSection === 'reviewAndSend' ? 'Send' : 'Review and Send'}
              </Button.Text>
            )}
          </AnimatePresence>
        </Button>
      </YStack>
    </FormProvider>
  )
})

function useValidateTransferUserOp() {
  return useMutation({
    mutationFn: async (userOp?: UserOperation<'v0.7'>) => {
      if (!userOp?.signature) return null

      try {
        await baseMainnetClient.call({
          account: entryPointAddress[baseMainnetClient.chain.id],
          to: userOp.sender,
          data: userOp.callData,
        })

        const { from, to, token, amount } = decodeTransferUserOp({ userOp })
        if (!from || !to || !amount || !token) {
          log('Failed to decode transfer user op', { from, to, amount, token })
          throw new Error('Not a valid transfer')
        }
        if (!allCoins.find((c) => c.token === token)) {
          log('Token ${token} is not a supported', { token })
          throw new Error(`Token ${token} is not a supported`)
        }
        if (amount < 0n) {
          log('User Operation has amount < 0', { amount })
          throw new Error('User Operation has amount < 0')
        }
        return userOp
      } catch (e) {
        const error = e instanceof Error ? e : new Error('Validation failed')
        throw error
      }
    },
  })
}

interface ReviewSendAmountBoxProps {
  localizedAmount: string
  selectedCoin: CoinWithBalance | undefined
  amountInUSD: number
  isPricesLoading: boolean
  isFeesLoading: boolean
  usdcFees:
    | {
        gasFees: bigint
        baseFee: bigint
        decimals: number
      }
    | undefined
  usdcFeesError: Error | null
}

const ReviewSendAmountBox = YStack.styleable<ReviewSendAmountBoxProps>((props) => {
  const {
    localizedAmount,
    selectedCoin,
    amountInUSD,
    isPricesLoading,
    isFeesLoading,
    usdcFees,
    usdcFeesError,
    ...rest
  } = props
  return (
    <YStack
      key="review-send-amount-box"
      animation="200ms"
      gap="$3"
      animateOnly={['opacity']}
      enterStyle={{
        opacity: 0,
      }}
      exitStyle={{
        opacity: 0,
      }}
      jc="center"
      {...rest}
    >
      <YStack gap="$4">
        <XStack gap="$2" ai="center">
          <IconCoin
            symbol={selectedCoin?.symbol ?? 'USDC'}
            size={localizedAmount.length > 10 ? '$1.5' : '$2.5'}
          />
          <SizableText size="$6" fow="500">
            {selectedCoin?.symbol}
          </SizableText>
        </XStack>
        <XStack ai={'center'} gap={'$2'} bbw={1} bbc="$gray8">
          <Text
            fontWeight={'700'}
            fontFamily="$mono"
            fontSize={localizedAmount?.length > 12 ? 32 : 40}
            lh={55}
            pb="$2"
          >
            {localizedAmount}
          </Text>
          {isPricesLoading ? (
            <Spinner size="small" color={'$color12'} />
          ) : (
            <SizableText color={'$color10'} fontSize={'$3'} fontFamily={'$mono'} mt={-1}>
              (
              {amountInUSD.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 2,
              })}
              )
            </SizableText>
          )}
        </XStack>
      </YStack>
      <YStack gap="$3">
        <XStack ai={'center'} jc={'space-between'} gap={'$4'}>
          <SizableText col="$gray11" size="$5">
            Fees
          </SizableText>
          {isFeesLoading && <Spinner size="small" color={'$color11'} />}
          {usdcFees && (
            <SizableText size="$5" col="$gray12">
              {formatAmount(formatUnits(usdcFees.baseFee + usdcFees.gasFees, usdcFees.decimals))}{' '}
              USDC
            </SizableText>
          )}
          {usdcFeesError && (
            <SizableText col="$error">{usdcFeesError?.message?.split('.').at(0)}</SizableText>
          )}
        </XStack>
      </YStack>
    </YStack>
  )
})

const ChatList = YStack.styleable(() => {
  const [{ recipient: recipientParam, idType: idTypeParam }] = useSendScreenParams()
  const { activeSection } = SendChatContext.useStyledContext()
  const { profile: currentUserProfile } = useUser()

  const {
    data: otherUserProfile,
    isLoading: isLoadingOtherUserProfile,
    error: otherUserProfileError,
  } = useProfileLookup(idTypeParam ?? 'tag', recipientParam ?? '')

  const {
    data,
    isLoading: isLoadingActivities,
    error: activitiesError,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = useInterUserActivityFeed({
    pageSize: 5,
    otherUserId: otherUserProfile?.sendid ?? undefined,
    currentUserId: currentUserProfile?.send_id,
  })

  const refScrollView = useRef<ScrollView>(null)

  useEffect(() => {
    if (activeSection === 'chat' && refScrollView.current) {
      refScrollView.current.scrollToEnd({ animated: false })
    }
  }, [activeSection])

  const { pages } = data ?? {}
  const activities = (pages?.flat() || []).filter(Boolean)

  const renderItem = useCallback(
    ({ item }: { item: (typeof activities)[number] }) => {
      return <Item item={item} currentUserProfile={currentUserProfile} />
    },
    [currentUserProfile]
  )

  const loadingSkeletons =
    activities.length === 0 && (isLoadingActivities || isLoadingOtherUserProfile) ? (
      <YStack jc="flex-end" f={1} gap="$6" p="$6">
        <Shimmer w={280} h={100} br="$4" />
        <Shimmer als="flex-end" w={280} h={100} br="$4" />
      </YStack>
    ) : null

  const noActivity =
    !activities || activities.length === 0 ? (
      <YStack ai="center" jc="center" f={1} gap="$4">
        <History col="$gray11" size="$6" />
        <YStack jc="center" ai="center" gap="$4">
          <SizableText size="$8">No transactions yet</SizableText>
          <SizableText size="$5" col="$gray11">
            Your next transaction will appear here
          </SizableText>
        </YStack>
      </YStack>
    ) : null

  const error = activitiesError || otherUserProfileError
  let errorComponent: React.ReactNode | null = null
  if (error) {
    errorComponent = (
      <YStack ai="center" jc="center" f={1} gap="$4">
        <YStack jc="center" ai="center" gap="$4">
          <SizableText size="$8">Something went wrong!</SizableText>
          <SizableText size="$5" col="$gray11">
            An error occurred while loading your activity feed. Please try again in a few moments.
          </SizableText>
        </YStack>
      </YStack>
    )
  }

  return (
    <View
      animation={[
        'responsive',
        {
          opacity: '50ms',
          transform: 'responsive',
        },
      ]}
      scaleY={activeSection === 'chat' ? 1 : 0.5}
      opacity={activeSection === 'chat' ? 1 : 0}
      y={activeSection === 'chat' ? 0 : -50}
      f={1}
      $platform-web={{
        willChange: 'transform',
        filter: activeSection === 'chat' ? 'blur(0px)' : 'blur(4px)',
        transition: 'filter linear 100ms',
      }}
      animateOnly={['transform', 'opacity']}
      px="$4.5"
      $xs={{
        px: '$2',
      }}
    >
      {errorComponent ? (
        errorComponent
      ) : loadingSkeletons ? (
        loadingSkeletons
      ) : !activities || activities.length === 0 ? (
        noActivity
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(activity) =>
            `${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`
          }
          onEndReached={() => hasNextPage && fetchNextPage()}
          ListFooterComponent={
            !isLoadingActivities && isFetchingNextPageActivities ? <Spinner size="small" /> : null
          }
          inverted
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 12,
          }}
        />
      )}
    </View>
  )
})

import type { Activity } from 'app/utils/zod/activity'
import { amountFromActivity } from 'app/utils/activity'
import {
  isTemporalEthTransfersEvent,
  isTemporalTokenTransfersEvent,
} from 'app/utils/zod/activity/TemporalTransfersEventSchema'
import { Transaction } from './Transaction'

interface ItemProps {
  item: Activity
  currentUserProfile: ReturnType<typeof useUser>['profile']
}

const Item = YStack.styleable<ItemProps>((props) => {
  const { setTransaction } = SendChatContext.useStyledContext()
  const { item, currentUserProfile } = props
  const isSent = item.from_user?.send_id === currentUserProfile?.send_id

  const amount = amountFromActivity(item)
  const date = useTransactionEntryDate({ activity: item, sent: isSent })

  return (
    <View py="$4" onPress={() => setTransaction(item)} cursor="pointer">
      <YStack gap="$2">
        <YStack
          w="60%"
          bg={isSent ? '$aztec6' : '$aztec4'}
          bw={isSent ? 0 : 1}
          boc={isSent ? 'transparent' : '$aztec4'}
          $theme-light={{
            bg: isSent ? '$gray3' : '$gray1',
            boc: isSent ? 'transparent' : '$gray2',
          }}
          br="$5"
          gap="$3"
          p="$3"
          pb="$4"
          als={isSent ? 'flex-end' : 'flex-start'}
          ov="hidden"
        >
          <SizableText size="$3" fow="300" color="$aztec9">
            {isSent ? 'You sent' : 'You received'}
          </SizableText>
          <XStack ai="center" gap="$3">
            <SizableText size="$8" fow="500" color={isSent ? '$color' : '$neon9'}>
              {amount?.replace('+ ', '')}
            </SizableText>
            <IconCoin symbol={item.data?.coin?.symbol ?? ''} size="$1" />
          </XStack>
          {item.data?.note && (
            <View p="$2" pb="$4" px="$3.5" mx="$-3.5" mb="$-4">
              <SizableText size="$5" fow="300" color="$aztec10">
                {decodeURIComponent(item.data?.note ?? '')}
              </SizableText>
            </View>
          )}
        </YStack>
        <SizableText als={isSent ? 'flex-end' : 'flex-start'} size="$2" color="$gray10">
          {date}
        </SizableText>
      </YStack>
    </View>
  )
})

const useTransactionEntryDate = ({ activity, sent }: { activity: Activity; sent: boolean }) => {
  const { created_at, data } = activity
  const isTemporalTransfer =
    isTemporalEthTransfersEvent(activity) || isTemporalTokenTransfersEvent(activity)

  if (isTemporalTransfer) {
    switch (data.status) {
      case 'failed':
      case 'cancelled':
        return <DateText sent={sent}>Failed</DateText>
      default:
        return (
          <DateText sent={sent}>
            {new Date(created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </DateText>
        )
    }
  }

  return (
    <DateText sent={sent}>
      {new Date(created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
    </DateText>
  )
}
export const DateText = ({ children, sent }: PropsWithChildren & { sent: boolean }) => {
  return (
    <Paragraph
      display={'flex'}
      size={'$2'}
      ta={sent ? 'right' : 'left'}
      color={'$darkGrayTextField'}
      $theme-light={{ color: '$silverChalice' }}
    >
      {children}
    </Paragraph>
  )
}
