import {
  Avatar,
  Button,
  LinkableAvatar,
  Paragraph,
  type ParagraphProps,
  ScrollView,
  Separator,
  Spinner,
  XStack,
  YStack,
  type TamaguiElement,
} from '@my/ui'
import { baseMainnet, baseMainnetClient, entryPointAddress } from '@my/wagmi'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { IconAccount } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { useSendScreenParams } from 'app/routers/params'
import { assert } from 'app/utils/assert'
import formatAmount, { localizeAmount } from 'app/utils/formatAmount'
import { useSendAccount } from 'app/utils/send-accounts'
import { shorten } from 'app/utils/strings'
import { throwIf } from 'app/utils/throwIf'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useUSDCFees } from 'app/utils/useUSDCFees'
import { useGenerateTransferUserOp } from 'app/utils/useUserOpTransferMutation'
import { useAccountNonce } from 'app/utils/userop'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'solito/router'
import { formatUnits, isAddress } from 'viem'
import { useEstimateFeesPerGas } from 'wagmi'
import { useCoin } from 'app/provider/coins'
import { useCoinFromSendTokenParam } from 'app/utils/useCoinFromTokenParam'
import { allCoins, allCoinsDict } from 'app/data/coins'

import debug from 'debug'
import { useTokenPrices } from 'app/utils/useTokenPrices'

const log = debug('app:features:send:confirm:screen')
import { api } from 'app/utils/api'
import { signUserOp } from 'app/utils/signUserOp'
import { decodeTransferUserOp } from 'app/utils/decodeTransferUserOp'
import type { UserOperation } from 'permissionless'
import { formFields } from 'app/utils/SchemaForm'

export function SendConfirmScreen() {
  const [queryParams] = useSendScreenParams()
  const { recipient, idType, sendToken, amount, note } = queryParams
  const { data: profile, isLoading, error } = useProfileLookup(idType ?? 'tag', recipient ?? '')

  const router = useRouter()

  useEffect(() => {
    if (!recipient)
      router.replace({
        pathname: '/send',
        query: {
          idType: idType,
          recipient: recipient,
          sendToken: sendToken,
          amount: amount,
          note,
        },
      })
  }, [recipient, idType, router, sendToken, amount, note])

  if (error) throw new Error(error.message)
  if (isLoading && !profile) return <Spinner size="large" />
  return <SendConfirm />
}

export function SendConfirm() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [queryParams] = useSendScreenParams()
  const { sendToken, recipient, idType, amount, note } = queryParams
  const { data: sendAccount, isLoading: isSendAccountLoading } = useSendAccount()
  const { coin: selectedCoin } = useCoinFromSendTokenParam()

  const submitButtonRef = useRef<TamaguiElement | null>(null)

  // states for auth flow
  const [error, setError] = useState<Error | null>(null)
  const {
    mutateAsync: transfer,
    isPending: isTransferPending,
    isSuccess: isTransferInitialized,
  } = api.temporal.transfer.useMutation()

  const isUSDCSelected = selectedCoin?.label === 'USDC'
  const { coin: usdc } = useCoin('USDC')
  const { data: prices, isLoading: isPricesLoading } = useTokenPrices()

  const { data: profile, isLoading: isProfileLoading } = useProfileLookup(
    idType ?? 'tag',
    recipient ?? ''
  )

  const href = profile ? `/profile/${profile?.sendid}` : ''

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

  const hasEnoughBalance = selectedCoin?.balance && selectedCoin.balance >= BigInt(amount ?? '0')
  const gas = usdcFees ? usdcFees.baseFee + usdcFees.gasFees : BigInt(Number.MAX_SAFE_INTEGER)
  const hasEnoughGas =
    (usdc?.balance ?? BigInt(0)) > (isUSDCSelected ? BigInt(amount ?? '0') + gas : gas)

  const isLoading =
    nonceIsLoading || isProfileLoading || isSendAccountLoading || isGeneratingUserOp || isGasLoading

  const isSubmitting = isValidatePending || isTransferPending || isTransferInitialized

  const canSubmit = (!isLoading || !isSubmitting) && hasEnoughBalance && hasEnoughGas && feesPerGas

  const localizedAmount = localizeAmount(
    formatUnits(
      BigInt(amount ?? ''),
      selectedCoin?.decimals ?? allCoinsDict[sendToken]?.decimals ?? 0
    )
  )

  const price = prices?.[sendToken] ?? 0
  const amountInUSD =
    price *
    Number(
      formatUnits(
        BigInt(amount ?? ''),
        selectedCoin?.decimals ?? allCoinsDict[sendToken]?.decimals ?? 0
      )
    )

  const onEdit = () => {
    router.push({
      pathname: '/send',
      query: {
        idType,
        recipient,
        amount: amount ?? '',
        sendToken,
        note,
      },
    })
  }

  async function onSubmit() {
    try {
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

      const { workflowId } = await transfer({ userOp: validatedUserOp, note })

      if (workflowId) {
        await queryClient.invalidateQueries({
          queryKey: ['token_activity_feed', { address: selectedCoin.token }],
        })
        router.replace({ pathname: '/', query: { token: sendToken } })
      }
    } catch (e) {
      // @TODO: handle sending repeated tx when nonce is still pending
      // if (e.message.includes('Workflow execution already started')) {
      //   router.replace({ pathname: '/', query: { token: sendToken } })
      //   return
      // }
      console.error(e)
      setError(e)
      await queryClient.invalidateQueries({ queryKey: [useAccountNonce.queryKey] })
    }
  }

  useEffect(() => {
    if (submitButtonRef.current) {
      submitButtonRef.current.focus()
    }
  }, [])

  if (isSendAccountLoading || nonceIsLoading || isProfileLoading)
    return <Spinner size="large" color={'$color12'} />

  return (
    <YStack
      f={1}
      jc={'space-between'}
      pb={'$4'}
      gap={'$3.5'}
      $gtLg={{
        display: 'flex',
        maxWidth: '50%',
      }}
    >
      <YStack gap={'$4'} pt={'$4'}>
        <YStack
          bg={'$color1'}
          br={'$6'}
          p={'$6'}
          gap={'$4.5'}
          $gtSm={{
            gap: '$5',
          }}
        >
          <XStack gap={'$4'} ai={'center'}>
            <LinkableAvatar circular size={'$3'} href={href}>
              <Avatar.Image
                src={profile?.avatar_url ?? ''}
                testID="avatarImage"
                accessibilityLabel={profile?.name ?? '??'}
                accessibilityRole="image"
                accessible
              />
              <Avatar.Fallback jc="center">
                <IconAccount size={'$3'} color="$olive" />
              </Avatar.Fallback>
            </LinkableAvatar>
            <Paragraph
              nativeID="profileName"
              size={'$6'}
              color={'$silverChalice'}
              fontWeight={'500'}
              $theme-light={{
                color: '$darkGrayTextField',
              }}
            >
              {(() => {
                switch (true) {
                  case idType === 'address':
                    return shorten(recipient, 5, 4)
                  case !!profile?.name:
                    return profile?.name
                  case !!profile?.all_tags?.[0]:
                    return `/${profile.all_tags[0]}`
                  case !!profile?.sendid:
                    return `#${profile?.sendid}`
                  default:
                    return '??'
                }
              })()}
            </Paragraph>
          </XStack>
          <XStack w="100%" jc="space-between" ai="flex-end" flexWrap={'wrap'}>
            <YStack gap={'$2'}>
              <XStack ai={'center'} gap={'$2'}>
                <Paragraph
                  fontWeight={'700'}
                  size={localizedAmount.length > 18 ? '$7' : '$9'}
                  $gtSm={{
                    size: localizedAmount.length > 16 ? '$8' : '$10',
                  }}
                >
                  {localizedAmount} {selectedCoin?.symbol}
                </Paragraph>
                <IconCoin
                  symbol={selectedCoin?.symbol ?? 'USDC'}
                  size={localizedAmount.length > 10 ? '$1.5' : '$2.5'}
                />
              </XStack>
              {isPricesLoading ? (
                <Spinner size="small" color={'$color12'} />
              ) : (
                <Paragraph color={'$color10'} fontSize={'$3'} fontFamily={'$mono'} mt={-1}>
                  (
                  {amountInUSD.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 2,
                  })}
                  )
                </Paragraph>
              )}
            </YStack>
            <Paragraph
              onPress={onEdit}
              cursor="pointer"
              hoverStyle={{ color: '$primary' }}
              size={'$5'}
              pl={'$2'}
              textAlign={'right'}
            >
              edit
            </Paragraph>
          </XStack>
          <Separator px="$4" bw="$0.75" borderRadius={'$4'} />
          <YStack gap={'$2'}>
            <XStack ai={'center'} jc={'space-between'} gap={'$4'}>
              <Paragraph
                color={'$silverChalice'}
                size={'$6'}
                $theme-light={{
                  color: '$darkGrayTextField',
                }}
              >
                Fees
              </Paragraph>
              {isFeesLoading && <Spinner size="small" color={'$color11'} />}
              {usdcFees && (
                <Paragraph size={'$6'}>
                  {formatAmount(
                    formatUnits(usdcFees.baseFee + usdcFees.gasFees, usdcFees.decimals)
                  )}{' '}
                  USDC
                </Paragraph>
              )}
              {usdcFeesError && (
                <Paragraph color="$error">{usdcFeesError?.message?.split('.').at(0)}</Paragraph>
              )}
            </XStack>
          </YStack>
        </YStack>
        {Boolean(note) && (
          <YStack
            bg={'$color1'}
            br={'$6'}
            p={'$6'}
            gap={'$4.5'}
            $gtSm={{
              gap: '$5',
            }}
          >
            <XStack gap={'$2'} ai={'center'} jc={'space-between'}>
              <Paragraph
                color={'$silverChalice'}
                size={'$6'}
                $theme-light={{
                  color: '$darkGrayTextField',
                }}
              >
                Your note
              </Paragraph>
              <Paragraph
                onPress={onEdit}
                cursor="pointer"
                hoverStyle={{ color: '$primary' }}
                size={'$5'}
                pl={'$2'}
                textAlign={'right'}
              >
                edit
              </Paragraph>
            </XStack>
            <Paragraph fontSize={17} whiteSpace={'pre-wrap'}>
              {note}
            </Paragraph>
          </YStack>
        )}
        {error && (
          <ErrorMessage
            error={(error as { details?: string }).details ?? error.message ?? 'Error sending'}
          />
        )}
      </YStack>
      <Button
        ref={submitButtonRef}
        theme={error ? 'red_alt1' : 'green'}
        onPress={onSubmit}
        disabledStyle={{ opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' }}
        disabled={!canSubmit}
        br={'$4'}
        gap={4}
        py={'$5'}
        width={'100%'}
      >
        {(() => {
          switch (true) {
            case isSubmitting:
              return (
                <Button.Icon>
                  <Spinner size="small" color="$color12" />
                </Button.Icon>
              )
            case !hasEnoughBalance:
              return <Button.Text fontWeight={'600'}>Insufficient Balance</Button.Text>
            case !hasEnoughGas:
              return <Button.Text fontWeight={'600'}>Insufficient Gas</Button.Text>
            default:
              return <Button.Text fontWeight={'600'}>SEND</Button.Text>
          }
        })()}
      </Button>
    </YStack>
  )
}

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

function ErrorMessage({ error, ...props }: ParagraphProps & { error?: string }) {
  if (!error) return null

  return (
    <ScrollView height="$4">
      <Paragraph testID="SendConfirmError" size="$2" width="100%" col={'$error'} {...props}>
        {error.split('.').at(0)}
      </Paragraph>
    </ScrollView>
  )
}
