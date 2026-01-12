import type React from 'react'
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from 'react'
import { useContactBySendId } from 'app/features/contacts/hooks/useContactBySendId'
import { useContactByExternalAddress } from 'app/features/contacts/hooks/useContactByExternalAddress'
import { getContactDisplayName } from 'app/features/contacts/utils/getContactDisplayName'
import {
  AnimatePresence,
  Avatar,
  Button,
  createStyledContext,
  GorhomSheetInput,
  Input as InputOG,
  LinearGradient,
  Link,
  Paragraph,
  Portal,
  type ScrollView,
  Shimmer,
  SizableText,
  Spinner,
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
  type ViewProps,
  XStack,
  YStack,
} from '@my/ui'

import type BottomSheet from '@gorhom/bottom-sheet'
import { SendModalContainer, ReviewSendAmountBox, NoteInput } from '../shared'

import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'

import { formatUnits, isAddress } from 'viem'

import type { InfiniteData } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { allCoins, allCoinsDict } from 'app/data/coins'
import { IconBadgeCheckSolid2, IconCoin, IconAccount, IconHeart } from 'app/components/icons'
import { AddressAvatar } from 'app/components/avatars'
import formatAmount, { localizeAmount, sanitizeAmount } from 'app/utils/formatAmount'
import { AlertCircle, CheckCheck, Clock4, History, X } from '@tamagui/lucide-icons'
import { useSendScreenParams } from 'app/routers/params'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { shorten } from 'app/utils/strings'
import { isAndroid, isWeb } from '@tamagui/constants'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { formFields } from 'app/utils/SchemaForm'
import { zodResolver } from '@hookform/resolvers/zod'
import { CoinField } from './CoinField'
import { useCoin, useCoins } from 'app/provider/coins'
import { assert } from 'app/utils/assert'
import { useSendAccount } from 'app/utils/send-accounts'
import { useUser } from 'app/utils/useUser'
import { api } from 'app/utils/api'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { useAccountNonce } from 'app/utils/userop'
import { useGenerateTransferUserOp } from 'app/utils/useUserOpTransferMutation'
import { useUSDCFees } from 'app/utils/useUSDCFees'
import { useEstimateFeesPerGas } from 'wagmi'
import { baseMainnet, baseMainnetClient, entryPointAddress, usdcAddress } from '@my/wagmi'
import { FlatList } from 'react-native'
import { throwIf } from 'app/utils/throwIf'
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated'

import debug from 'debug'
import { signUserOp } from 'app/utils/signUserOp'
import type { UserOperation } from 'permissionless'
import { decodeTransferUserOp } from 'app/utils/decodeTransferUserOp'
import { useInterUserActivityFeed } from 'app/features/profile/utils/useInterUserActivityFeed'
import type { Activity } from 'app/utils/zod/activity'
import { Events } from 'app/utils/zod/activity'
import { amountFromActivity } from 'app/utils/activity'
import {
  isTemporalEthTransfersEvent,
  isTemporalTokenTransfersEvent,
} from 'app/utils/zod/activity/TemporalTransfersEventSchema'
import { Transaction } from './Transaction'
import type { Database } from '@my/supabase/database.types'

const log = debug('app:features:send:confirm:screen')

type Sections = 'chat' | 'enterAmount' | 'reviewAndSend'

const AnimatedYStack = Animated.createAnimatedComponent(YStack)

const SendChatContext = createStyledContext<{
  activeSection: Sections
  setActiveSection: React.Dispatch<React.SetStateAction<Sections>>
  setTransaction: React.Dispatch<React.SetStateAction<Activity | undefined>>
  transaction: Activity | undefined
  useSendScreenParams: typeof useSendScreenParams
}>({
  activeSection: 'chat',
  setActiveSection: () => {},
  setTransaction: () => {},
  transaction: undefined,
  useSendScreenParams: (() => [{}, () => {}]) as unknown as typeof useSendScreenParams,
})

interface SendChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const Input = (isWeb ? InputOG : GorhomSheetInput) as unknown as typeof InputOG

export const SendChat = memo(
  ({ open: openProp, onOpenChange: onOpenChangeProp }: SendChatProps) => {
    const { height } = useWindowDimensions()
    const { height: keyboardHeight } = useReanimatedKeyboardAnimation()
    const { bottom: safeAreaBottom } = useSafeAreaInsets()

    const springKeyboardHeight = useDerivedValue(() => {
      'worklet'
      return withSpring(keyboardHeight.value, {
        damping: 15,
        stiffness: 150,
        mass: 0.5,
      })
    }, [keyboardHeight])

    const animatedStyle = useAnimatedStyle(() => {
      'worklet'
      return {
        transform: [
          {
            translateY:
              springKeyboardHeight.value + (-springKeyboardHeight.value > 0 ? safeAreaBottom : 0),
          },
        ],
      }
    }, [springKeyboardHeight, safeAreaBottom])

    const { gtLg } = useMedia()

    const [open, setOpen] = useControllableState({
      defaultProp: false,
      prop: openProp,
      onChange: onOpenChangeProp,
    })

    const [transaction, setTransaction] = useState<Activity>()

    // Capture the hook result BEFORE useState so we can determine initial section
    // This also creates a stable reference to params that works inside Portal
    const sendScreenParamsResult = useSendScreenParams()
    const [sendParams] = sendScreenParamsResult

    // Determine initial section: if deep link has valid send params, go directly to enterAmount
    const hasValidDeepLinkParams = Boolean(
      sendParams.recipient && sendParams.idType && sendParams.amount && sendParams.sendToken
    )
    const externalAddressPrefill = Boolean(
      sendParams.recipient &&
        sendParams.idType === 'address' &&
        isAddress((sendParams.recipient || '') as `0x${string}`)
    )

    const [activeSection, setActiveSection] = useState<Sections>(() =>
      hasValidDeepLinkParams || externalAddressPrefill ? 'enterAmount' : 'chat'
    )
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
          <SendModalContainer bottomSheetRef={bottomSheetRef} open={open} setOpen={setOpen}>
            <SendChatContext.Provider
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              setTransaction={setTransaction}
              transaction={transaction}
              useSendScreenParams={() => sendScreenParamsResult}
            >
              <AnimatePresence>
                {(open || !gtLg) && (
                  <View
                    testID="SendChat"
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
                      <AnimatedYStack
                        br="$6"
                        elevation="$9"
                        shadowOpacity={0.4}
                        ov="hidden"
                        f={1}
                        bg="$color1"
                        style={animatedStyle}
                      >
                        <SendChatHeader
                          onClose={() => {
                            if (activeSection === 'chat') {
                              setOpen(false)
                              bottomSheetRef.current?.close()
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
                      </AnimatedYStack>
                    </YStack>
                  </View>
                )}
              </AnimatePresence>
            </SendChatContext.Provider>
          </SendModalContainer>
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
)

SendChat.displayName = 'SendChat'

interface SendChatHeaderProps {
  onClose: () => void
}

const SendChatHeader = XStack.styleable<SendChatHeaderProps>(({ onClose, ...props }) => {
  const themeName = useThemeName()
  const isDark = themeName.includes('dark')

  const { useSendScreenParams } = SendChatContext.useStyledContext()
  const [{ recipient, idType }] = useSendScreenParams()
  const { data: profile } = useProfileLookup(idType ?? 'tag', recipient ?? '')

  // Look up contact to get custom_name if it exists
  const { data: contact } = useContactBySendId(profile?.sendid ?? undefined)

  const isExternalAddress = idType === 'address' && isAddress((recipient || '') as `0x${string}`)

  // Look up external address contact for custom_name
  const { data: externalContact } = useContactByExternalAddress(
    isExternalAddress ? recipient : undefined
  )
  const href = isExternalAddress
    ? `/profile/${recipient}`
    : profile
      ? `/profile/${profile?.sendid}`
      : ''

  const tagName = isExternalAddress
    ? shorten(recipient, 5, 4)
    : profile?.tag
      ? `/${profile?.tag}`
      : `#${profile?.sendid}`

  // Display name priority: custom_name > profile_name > sendtag > send_id > address
  const displayName = useMemo(() => {
    if (isExternalAddress) {
      // Use external contact's custom_name if available, otherwise shortened address
      return externalContact?.custom_name || tagName
    }
    if (contact) {
      return getContactDisplayName({
        custom_name: contact.custom_name,
        profile_name: contact.profile_name,
        main_tag_name: contact.main_tag_name,
        send_id: contact.send_id,
        external_address: null,
      })
    }
    // No contact - use profile name or tag
    return profile?.name || tagName?.replace('/', '').replace('#', '') || '—-'
  }, [contact, profile, tagName, isExternalAddress, externalContact])

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
      <XStack>
        {href ? (
          <Link
            hoverStyle={{ opacity: 0.8 }}
            focusStyle={{ opacity: 0.8 }}
            pressStyle={{ scale: 0.95 }}
            href={href}
          >
            {isExternalAddress && !profile?.avatar_url && recipient ? (
              <AddressAvatar
                address={recipient as `0x${string}`}
                size="$4.5"
                br="$10"
                elevation="$0.75"
              />
            ) : (
              <Avatar circular size="$4.5" elevation="$0.75">
                {isAndroid && !profile?.avatar_url ? (
                  <IconAccount size={'$4'} color="$olive" />
                ) : (
                  <>
                    <Avatar.Image src={profile?.avatar_url ?? ''} />
                    <Avatar.Fallback jc="center">
                      <IconAccount size={'$4'} color="$olive" />
                    </Avatar.Fallback>
                  </>
                )}
              </Avatar>
            )}
          </Link>
        ) : (
          <Avatar circular size="$4.5" elevation="$0.75">
            <Avatar.Fallback jc="center">
              <IconAccount size={'$4'} color="$olive" />
            </Avatar.Fallback>
          </Avatar>
        )}
        {/* Badge priority: favorite > verified > none */}
        {!isExternalAddress && contact?.is_favorite ? (
          <XStack zi={100} pos="absolute" bottom={0} right={0} x="$1" y="$1">
            <IconHeart size="$1" color="$red9" />
          </XStack>
        ) : profile?.is_verified && !isExternalAddress ? (
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
        ) : null}
      </XStack>
      <YStack gap="$1.5" f={1}>
        <SizableText size="$4" color="$gray12" fow="500">
          {displayName}
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
        hoverStyle={{ boc: '$aztec4' }}
        pressStyle={{ boc: '$aztec4', scale: 0.9 }}
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
        {isWeb && (
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
        )}
      </View>
      <YStack w="100%" zi={1}>
        <XStack py="$4" px="$4">
          <View
            testID="SendChatEnterAmountTrigger"
            animation="responsive"
            animateOnly={['height', 'transform']}
            h={activeSection === 'chat' ? 47 : 80}
            y={activeSection === 'chat' ? 0 : -84}
            f={1}
            tabIndex={0}
            onPress={() => setActiveSection('enterAmount')}
            pe={activeSection === 'enterAmount' ? 'box-none' : 'box-only'}
          >
            <Input
              bg="$aztec5"
              $theme-light={{
                bg: '$gray3',
              }}
              numberOfLines={4}
              multiline
              verticalAlign="top"
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
  const { useSendScreenParams } = SendChatContext.useStyledContext()
  const [sendParams, setSendParams] = useSendScreenParams()
  const { coin } = useCoin(sendParams.sendToken || usdcAddress[baseMainnet.id])

  const themeName = useThemeName()

  const { recipient, idType } = sendParams

  const isExternalAddress = idType === 'address' && isAddress((recipient || '') as `0x${string}`)

  const { isLoading: isLoadingCoins } = useCoins()
  const form = useForm<z.infer<typeof SendAmountSchema>>({
    resolver: zodResolver(SendAmountSchema),
    defaultValues: {
      token: coin?.token,
      amount:
        sendParams.amount && coin !== undefined
          ? localizeAmount(formatUnits(BigInt(sendParams.amount), coin.decimals))
          : undefined,
      note: isExternalAddress ? '' : sendParams.note || '',
    },
  })

  const [present] = usePresence()
  const { setActiveSection, activeSection } = SendChatContext.useStyledContext()

  const { data: profile, isLoading: isProfileLoading } = useProfileLookup(
    idType ?? 'tag',
    recipient ?? ''
  )

  const [amountInputRef, setAmountInputRef] = useState<InputOG | null>(null)

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

        if (!isExternalAddress) {
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
        }
        setSendParams(
          {
            ...sendParams,
            amount: sanitizedAmount,
            sendToken,
            note: isExternalAddress ? undefined : note.trim(),
          },
          { webBehavior: 'replace' }
        )
      },
      [setSendParams, sendParams, form, isExternalAddress]
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
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    // disabled autofocus on native coz its tricky to change token
    if (activeSection === 'enterAmount' && amountInputRef && isWeb) {
      timeoutId = setTimeout(() => {
        amountInputRef?.focus()
      }, 500)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [activeSection, amountInputRef])

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
  const { coin: selectedCoin } = useCoin(sendToken || usdcAddress[baseMainnet.id])
  const { profile: currentUserProfile } = useUser()

  const [loadingSend, setLoadingSend] = useState(false)

  const [, setError] = useState<Error | null>(null)
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

        // optimistic activity entry
        const optimisticActivity: Activity = {
          event_id: `optimistic/${Date.now()}/${Math.random()}`,
          event_name: Events.TemporalSendAccountTransfers,
          created_at: new Date(),
          from_user: currentUserProfile
            ? {
                id: currentUserProfile.id,
                name: currentUserProfile.name ?? null,
                avatar_url: currentUserProfile.avatar_url ?? null,
                send_id: currentUserProfile.send_id,
                main_tag_id: currentUserProfile.main_tag?.id ?? null,
                main_tag_name: currentUserProfile.main_tag?.name ?? null,
                tags: currentUserProfile.tags?.map((t) => t.name) ?? null,
                is_verified: null,
              }
            : null,
          to_user: profile
            ? {
                id: null,
                name: profile.name ?? null,
                avatar_url: profile.avatar_url ?? null,
                send_id: profile.sendid ?? 0,
                main_tag_id: null,
                main_tag_name: null,
                tags: null,
                is_verified: null,
              }
            : null,
          data:
            sendToken === 'eth'
              ? {
                  status: 'initialized' as const,
                  log_addr: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                  sender: sender,
                  value: BigInt(amount ?? '0'),
                  note: note || undefined,
                  coin: selectedCoin,
                }
              : {
                  status: 'initialized' as const,
                  log_addr: sendToken as `0x${string}`,
                  f: sender,
                  t: (profile?.address ?? recipient) as `0x${string}`,
                  v: BigInt(amount ?? '0'),
                  note: note || undefined,
                  coin: selectedCoin,
                },
        }

        queryClient.setQueryData<InfiniteData<Activity[]>>(['activity_feed'], (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page, index) =>
              index === 0 ? [optimisticActivity, ...page] : page
            ),
          }
        })

        queryClient.setQueryData<InfiniteData<Activity[]>>(
          ['inter_user_activity_feed', profile?.sendid, currentUserProfile?.send_id],
          (old) => {
            if (!old) return old
            return {
              ...old,
              pages: old.pages.map((page, index) =>
                index === 0 ? [optimisticActivity, ...page] : page
              ),
            }
          }
        )

        let workflowId: string | undefined
        try {
          const result = await transfer({
            userOp: validatedUserOp,
            ...(note && { note: encodeURIComponent(note) }),
          })
          workflowId = result.workflowId

          if (workflowId) {
            // Don't await - fire and forget to avoid iOS hanging on cache operations
            void queryClient.invalidateQueries({
              queryKey: ['activity_feed'],
              exact: false,
            })

            void queryClient.invalidateQueries({
              queryKey: ['inter_user_activity_feed', profile?.sendid, currentUserProfile?.send_id],
              exact: false,
            })

            // Stay on chat to show transaction history
            setActiveSection('chat')
          }
        } catch (transferError) {
          void queryClient.resetQueries({
            queryKey: ['activity_feed'],
            exact: false,
          })
          void queryClient.resetQueries({
            queryKey: ['inter_user_activity_feed', profile?.sendid, currentUserProfile?.send_id],
            exact: false,
          })
          throw transferError
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

        setSendParams(
          {
            ...sendParams,
            note: undefined,
          },
          { webBehavior: 'replace' }
        )
      }
    }
  }

  const isSendButtonDisabled =
    loadingSend || (activeSection === 'enterAmount' ? !canSubmitSendReview : !canSubmitSend)

  const [isPresent] = usePresence()

  const isButtonPressed = useRef(false)

  useEffect(() => {
    if (activeSection === 'chat') {
      isButtonPressed.current = false
    }
  }, [activeSection])

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
        }}
      >
        <YStack gap="$3.5">
          <View
            animation={'responsive'}
            animateOnly={['opacity', 'transform']}
            enterStyle={{
              opacity: 0,
              y: -100,
            }}
            y={isPresent ? 0 : -100}
            o={isPresent ? 1 : 0}
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
                    <XStack key="enter-amount-box">
                      <Controller
                        control={form.control}
                        name="amount"
                        render={({ field: { value, onBlur } }) => (
                          <Input
                            testID="SendChatAmountInput"
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
                                ? '0'
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
            // @ts-expect-error - delay is not typed properly
            animation={present ? ['200ms', { delay: 200 }] : null}
            // changing animation at runtime require a key change to remount the component and avoid hook errors
            key={present ? 'note-input-enter' : 'note-input-exit'}
            opacity={present ? 1 : 0}
            enterStyle={{
              opacity: 0,
            }}
          >
            <NoteInput
              control={form.control}
              error={noteValidationError}
              disabled={isExternalAddress}
              placeholder={
                isExternalAddress ? 'Notes not supported for external address' : 'Add a note...'
              }
            />
          </View>
        </YStack>
        <Button
          testID={activeSection === 'reviewAndSend' ? 'SendChatSendButton' : 'SendChatReviewButton'}
          aria-label={activeSection === 'reviewAndSend' ? 'Send' : 'Review and Send'}
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
            isButtonPressed.current = true
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
                key={
                  isButtonPressed.current
                    ? `send-button-text-animated${activeSection}`
                    : 'send-button-text-no-animate'
                }
                fos="$5"
                col="$gray1"
                $theme-light={{ col: '$gray12' }}
                pos="absolute"
                {...(isButtonPressed.current && {
                  animation: 'responsive',
                  animateOnly: ['opacity', 'transform'],
                  enterStyle: {
                    opacity: 0,
                    y: -40,
                  },
                  exitStyle: {
                    opacity: 0,
                    y: 40,
                  },
                })}
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

type ListItem = { type: 'activity'; activity: Activity } | { type: 'dateHeader'; date: Date }

const formatDateHeader = (date: Date): string => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateToCheck = new Date(date)
  dateToCheck.setHours(0, 0, 0, 0)

  if (dateToCheck.getTime() === today.getTime()) {
    return 'Today'
  }

  if (dateToCheck.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  }

  return dateToCheck.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const groupActivitiesByDate = (activities: Activity[]): ListItem[] => {
  if (activities.length === 0) return []

  const grouped: ListItem[] = []
  let currentDate: Date | null = null
  let currentDateHeader: Date | null = null
  let activitiesForCurrentDate: Activity[] = []

  const flushCurrentDateGroup = () => {
    if (activitiesForCurrentDate.length > 0 && currentDateHeader) {
      for (const activity of activitiesForCurrentDate) {
        grouped.push({ type: 'activity', activity })
      }
      grouped.push({ type: 'dateHeader', date: currentDateHeader })
      activitiesForCurrentDate = []
    }
  }

  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i]
    if (!activity) continue

    const activityDate = new Date(activity.created_at)
    const activityDateOnly = new Date(activityDate)
    activityDateOnly.setHours(0, 0, 0, 0)

    if (!currentDate || currentDate.getTime() !== activityDateOnly.getTime()) {
      flushCurrentDateGroup()
      currentDate = activityDateOnly
      currentDateHeader = activityDate
    }

    activitiesForCurrentDate.push(activity)
  }

  flushCurrentDateGroup()

  return grouped
}

const ChatList = YStack.styleable(() => {
  const { useSendScreenParams, activeSection } = SendChatContext.useStyledContext()
  const [{ recipient: recipientParam, idType: idTypeParam }] = useSendScreenParams()
  const { profile: currentUserProfile } = useUser()

  const {
    data: otherUserProfile,
    isLoading: isLoadingOtherUserProfile,
    error: otherUserProfileError,
  } = useProfileLookup(idTypeParam ?? 'tag', recipientParam ?? '')

  const isExternalAddress =
    idTypeParam === 'address' && isAddress((recipientParam || '') as `0x${string}`)

  const {
    data,
    isLoading: isLoadingActivities,
    error: activitiesError,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = useInterUserActivityFeed({
    pageSize: 5,
    otherUserId: isExternalAddress ? undefined : (otherUserProfile?.sendid ?? undefined),
    currentUserId: currentUserProfile?.send_id,
    externalAddress: isExternalAddress ? (recipientParam as `0x${string}`) : undefined,
  })

  const refScrollView = useRef<ScrollView>(null)

  useEffect(() => {
    if (activeSection === 'chat' && refScrollView.current) {
      refScrollView.current.scrollToEnd({ animated: false })
    }
  }, [activeSection])

  const { pages } = data ?? {}
  const activities = (pages?.flat() || []).filter(Boolean)

  const listItems = useMemo(() => groupActivitiesByDate(activities), [activities])

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'dateHeader') {
        return <DateHeader date={item.date} />
      }
      return <Item item={item.activity} currentUserProfile={currentUserProfile} />
    },
    [currentUserProfile]
  )

  const loadingSkeletons =
    listItems.length === 0 && (isLoadingActivities || isLoadingOtherUserProfile) ? (
      <YStack jc="flex-end" f={1} gap="$10" p="$8" px="$2">
        <Shimmer w={280} h={100} br="$4" />
        <Shimmer als="flex-end" w={280} h={100} br="$4" />
      </YStack>
    ) : null

  const noActivity =
    !listItems || listItems.length === 0 ? (
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
          opacity: '100ms',
          transform: 'responsive',
        },
      ]}
      scaleY={activeSection === 'chat' ? 1 : 0.5}
      opacity={activeSection === 'chat' ? 1 : 0}
      y={activeSection === 'chat' ? 0 : -50}
      f={1}
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
      ) : !listItems || listItems.length === 0 ? (
        noActivity
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item, index) => {
            if (item.type === 'dateHeader') {
              return `date-header-${item.date.toISOString().split('T')[0]}-${index}`
            }
            return `${item.activity.event_name}-${item.activity.created_at}-${item.activity?.from_user?.id}-${item.activity?.to_user?.id}`
          }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          inverted
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 12,
            opacity: !isLoadingActivities && isFetchingNextPageActivities ? 0.8 : 1,
          }}
        />
      )}
    </View>
  )
})

interface DateHeaderProps {
  date: Date
}

const DateHeader = YStack.styleable<DateHeaderProps>(({ date, ...props }) => {
  const formattedDate = formatDateHeader(date)

  return (
    <YStack ai="center" py="$4" {...props}>
      <XStack
        ai="center"
        gap="$2"
        px="$3"
        py="$1.5"
        br="$10"
        bg="$aztec3"
        $theme-light={{ bg: '$gray3' }}
      >
        <SizableText size="$3" fow="500" color="$gray11">
          {formattedDate}
        </SizableText>
      </XStack>
    </YStack>
  )
})

interface ItemProps {
  item: Activity
  currentUserProfile: ReturnType<typeof useUser>['profile']
}

type SentItemStatus = Database['temporal']['Enums']['transfer_status']
const Item = YStack.styleable<ItemProps>((props) => {
  const { setTransaction } = SendChatContext.useStyledContext()
  const { item, currentUserProfile } = props
  const isSent = item.from_user?.send_id === currentUserProfile?.send_id

  const amount = amountFromActivity(item)
  const date = useTransactionEntryDate({ activity: item, sent: isSent })

  const isTemporalTransfer =
    isTemporalEthTransfersEvent(item) || isTemporalTokenTransfersEvent(item)

  const status: SentItemStatus = isTemporalTransfer
    ? item.data.status || 'initialized'
    : 'confirmed'

  const isFailed = status === 'failed' || status === 'cancelled'
  const isConfirmed = status === 'confirmed'
  const isPending = status === 'initialized' || status === 'submitted' || status === 'sent'

  return (
    <View fd="row" ai="center" py="$4" onPress={() => setTransaction(item)} cursor="pointer">
      <YStack x={isFailed ? '$-4' : 0} f={1} gap="$2">
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
            <SizableText
              size="$8"
              fow="500"
              color={isSent ? '$color' : '$neon9'}
              lineHeight={isWeb ? undefined : 28}
            >
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
        <XStack
          flexDirection={isSent ? 'row' : 'row-reverse'}
          als={isSent ? 'flex-end' : 'flex-start'}
          gap="$1.5"
          ai="center"
        >
          {isFailed ? (
            <SizableText size="$2" color="$error">
              Failed to send
            </SizableText>
          ) : (
            <SizableText size="$2" color="$gray10">
              {date}
            </SizableText>
          )}
          {isPending && <Clock4 color="$gray10" size={12} />}
          {isConfirmed && <CheckCheck color="$gray10" size={12} />}
        </XStack>
      </YStack>
      {isFailed && <AlertCircle fs={0} color="$error" size="$1" />}
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
