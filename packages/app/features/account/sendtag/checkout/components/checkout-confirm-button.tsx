import {
  Button,
  ButtonIcon,
  type ButtonProps,
  ButtonText,
  Paragraph,
  Spinner,
  Tooltip,
  useMedia,
  YStack,
  type YStackProps,
} from '@my/ui'
import { AlertTriangle } from '@tamagui/lucide-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TRPCClientError } from '@trpc/client'
import { total } from 'app/data/sendtags'
import { api } from 'app/utils/api'
import { assert } from 'app/utils/assert'
import { byteaToHex } from 'app/utils/byteaToHex'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { usePendingTags } from 'app/utils/tags'
import { throwIf } from 'app/utils/throwIf'
import { useReceipts } from 'app/utils/useReceipts'
import { useReferralCodeCookie } from 'app/utils/useReferralCodeCookie'
import { useUser } from 'app/utils/useUser'
import { sendUserOpTransfer } from 'app/utils/useUserOpTransferMutation'
import { useAccountNonce } from 'app/utils/userop'
import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react'
import { isAddressEqual, zeroAddress } from 'viem'
import { useWaitForTransactionReceipt } from 'wagmi'
import {
  useReferralReward,
  useSendtagCheckout,
  useSendtagCheckoutReceipts,
} from '../checkout-utils'
import { useCoin } from 'app/provider/coins'
import { useReferrer } from 'app/utils/useReferrer'

export function ConfirmButton({ onConfirmed }: { onConfirmed: () => void }) {
  const { updateProfile } = useUser()
  const { data: sendAccount } = useSendAccount()
  const sender = useMemo(() => sendAccount?.address, [sendAccount?.address])

  const pendingTags = usePendingTags() ?? []
  const amountDue = useMemo(() => total(pendingTags ?? []), [pendingTags])
  const {
    data: referrerProfile,
    isLoading: isLoadingReferrer,
    error: referrerError,
  } = useReferrer()
  const { data: rewardDue } = useReferralReward({ tags: pendingTags })
  const { data: referralCodeCookie } = useReferralCodeCookie()
  const { coin: usdc, tokensQuery, isLoading: isLoadingUSDC } = useCoin('USDC')

  const webauthnCreds =
    sendAccount?.send_account_credentials
      .filter((c) => !!c.webauthn_credentials)
      .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? []
  const hasPendingTags = !!pendingTags?.length

  const [submitting, setSubmitting] = useState(false)
  const confirm = api.tag.confirm.useMutation()
  const { receipts, refetch: refetchReceipts, isLoading: isLoadingReceipts } = useReceipts()
  const receiptEventIds = useMemo(() => receipts?.map((r) => r.event_id) ?? [], [receipts])
  const [sentTx, setSentTx] = useState<`0x${string}`>()
  const {
    data: checkoutReceipts,
    error: checkoutErrors,
    dataUpdatedAt: checkoutReceiptUpdatedAt,
  } = useSendtagCheckoutReceipts()
  const [checkoutReceiptsLastFectched, setCheckoutReceiptsLastFectched] =
    useState(checkoutReceiptUpdatedAt)
  const lookupSendtagCheckout = useCallback(async () => {
    if (!sender) return
    if (isLoadingReceipts) return
    if (receipts === undefined) return
    if (!checkoutReceipts) return
    if (submitting) return
    if (error) return
    const event = checkoutReceipts
      ?.filter((e) => {
        const hash = byteaToHex(e.tx_hash as `\\x${string}`)
        const referrer = byteaToHex(e.referrer as `\\x${string}`)
        const amount = BigInt(e.amount)
        const rewardSent = BigInt(e.reward)
        const referrerAddress = (referrerProfile?.address ?? zeroAddress) as `0x${string}`
        const invalidReferrer =
          (!referrerProfile && rewardSent !== 0n) || // no referrer and reward is sent
          (referrerProfile && rewardSent !== rewardDue) || // referrer and invalid reward
          (rewardSent > 0n && !isAddressEqual(referrerAddress, referrer)) // referrer and reward sent is not the correct referrer

        const isPurchase =
          amount === amountDue && // check the correct amount
          !invalidReferrer && // check the correct reward
          !receiptEventIds.includes(e.event_id) && // don't double submit
          (!sentTx || sentTx === hash) // use the most recent tx if available
        return isPurchase
      })
      .shift()

    if (event && !confirm.isPending) {
      // check it against the receipts
      submitTxToDb(byteaToHex(event.tx_hash as `\\x${string}`))
    }
  }, [
    sender,
    isLoadingReceipts,
    receipts,
    checkoutReceipts,
    confirm,
    amountDue,
    sentTx,
    receiptEventIds,
    submitting,
    rewardDue,
    referrerProfile,
  ])

  useEffect(() => {
    if (checkoutReceipts?.length && checkoutReceiptUpdatedAt !== checkoutReceiptsLastFectched) {
      lookupSendtagCheckout().catch((e) => {
        console.error('Error looking up safe received events', e)
      })
      setCheckoutReceiptsLastFectched(checkoutReceiptUpdatedAt)
    }
  }, [
    checkoutReceipts,
    lookupSendtagCheckout,
    checkoutReceiptUpdatedAt,
    checkoutReceiptsLastFectched,
  ])

  const {
    data: txReceipt,
    isLoading: txWaitLoading,
    error: txWaitError,
  } = useWaitForTransactionReceipt({
    hash: sentTx,
  })

  const [error, setError] = useState<string>()
  const [attempts, setAttempts] = useState(0)
  const { userOp, userOpError, isLoadingUserOp, usdcFees, usdcFeesError, isLoadingUSDCFees } =
    useSendtagCheckout()
  const canAffordTags =
    usdc?.balance && usdcFees && usdc.balance + usdcFees.baseFee + usdcFees.gasFees >= amountDue

  const queryClient = useQueryClient()
  const { mutateAsync: sendUserOp, isPending: sendTransactionIsPending } = useMutation({
    mutationFn: sendUserOpTransfer,
    onSuccess: (userOpReceipt) => {
      if (userOpReceipt.success) {
        setSentTx(userOpReceipt.receipt.transactionHash)
      } else {
        setError(`Something went wrong: ${userOpReceipt.receipt.transactionHash}`)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [useAccountNonce.queryKey] })
      queryClient.invalidateQueries({ queryKey: [tokensQuery.queryKey] })
    },
  })

  async function handleCheckoutTx() {
    try {
      throwIf(userOpError)
      assert(!!userOp, 'User op is required')
      await sendUserOp({ userOp, webauthnCreds })
    } catch (e) {
      const msg = (e.details ?? e.message)?.split('.').at(0)
      console.error(msg, e)
      setError(msg)
    }
  }

  function submitTxToDb(tx: string) {
    setAttempts((a) => a + 1)
    setSubmitting(true)
    confirm
      .mutateAsync({ transaction: tx })
      .then(async () => {
        setSubmitting(false)
        await updateProfile().then(() => {
          refetchReceipts()
        })
        onConfirmed()
      })
      .catch((err) => {
        console.error('Error confirming', err)
        if (err instanceof TRPCClientError) {
          // handle transaction too new error
          if (
            [
              'Transaction too new.',
              'The Transaction may not be processed on a block yet.',
              `Transaction with hash "${tx}" could not be found`,
            ].some((s) => err.message.includes(s)) &&
            attempts < 10
          ) {
            // try again
            setTimeout(() => {
              submitTxToDb(tx)
            }, 1000)
            return
          }
        }
        setError((err?.details ?? err?.message)?.split('.').at(0) ?? 'Something went wrong')
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  useEffect(() => {
    if (txReceipt) submitTxToDb(txReceipt.transactionHash)
  }, [txReceipt])

  useEffect(() => {
    if (txWaitError) {
      setError(txWaitError.message.split('.').at(0))
    }
  }, [txWaitError])

  const possibleErrors = [checkoutErrors, userOpError, usdcFeesError, referrerError] as (Error & {
    details?: string
  })[]

  if (possibleErrors.some((e) => e?.message)) {
    for (const err of possibleErrors) {
      if (err) console.error('encountered error', err.message, err)
    }
    return (
      <ConfirmButtonStack>
        <ConfirmButtonError>
          <YStack gap="$2" ai="center">
            <Paragraph $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
              {possibleErrors
                .map((e) => (e?.details ?? e?.message ?? '').split('.').at(0))
                .filter(Boolean)
                .join(', ')}
            </Paragraph>
          </YStack>
        </ConfirmButtonError>
      </ConfirmButtonStack>
    )
  }

  const canRetry = error && !(submitting || sendTransactionIsPending || txWaitLoading)

  if (canRetry) {
    return (
      <ConfirmButtonError
        buttonText={'Retry'}
        onPress={() => {
          setError(undefined)
          switch (true) {
            case !txReceipt || txWaitError !== null:
              handleCheckoutTx()
              break
            default:
              submitTxToDb(txReceipt?.transactionHash)
              break
          }
        }}
      >
        <YStack gap="$2" ai="center">
          <Paragraph $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
            {error}
          </Paragraph>
        </YStack>
      </ConfirmButtonError>
    )
  }

  const canSubmit =
    hasPendingTags &&
    canAffordTags &&
    !isLoadingUserOp &&
    !sendTransactionIsPending &&
    !submitting &&
    !txWaitLoading &&
    !usdcFeesError &&
    !isLoadingUSDCFees &&
    !isLoadingReferrer &&
    (referrerProfile?.address || !referralCodeCookie)

  return (
    <ConfirmButtonStack w={'100%'} gap="$2">
      {tokensQuery.error && (
        <Paragraph color="$error">{tokensQuery.error?.message?.split('.').at(0)}</Paragraph>
      )}
      {usdcFeesError && (
        <Paragraph color="$error">{usdcFeesError?.message?.split('.').at(0)}</Paragraph>
      )}
      <Button
        disabled={!canSubmit}
        disabledStyle={{
          pointerEvents: 'none',
          opacity: 0.5,
        }}
        gap="$1.5"
        onPress={handleCheckoutTx}
        theme="green"
        borderRadius={'$4'}
        p={'$4'}
      >
        {(() => {
          switch (true) {
            case isLoadingUserOp ||
              isLoadingUSDC ||
              isLoadingUSDCFees ||
              isLoadingReceipts ||
              isLoadingReferrer:
              return (
                <>
                  <Spinner color="$color11" />
                  <ConfirmButtonText>loading...</ConfirmButtonText>
                </>
              )
            case !canAffordTags && (!txWaitLoading || !submitting):
              return <ButtonText>insufficient funds</ButtonText>
            case sendTransactionIsPending:
              return (
                <>
                  <Spinner color="$color11" />
                  <ConfirmButtonText>requesting...</ConfirmButtonText>
                </>
              )
            case txWaitLoading:
              return (
                <>
                  <Spinner color="$color11" />
                  <ConfirmButtonText>processing...</ConfirmButtonText>
                </>
              )
            case submitting:
              return (
                <>
                  <Spinner color="$color11" />
                  <ConfirmButtonText>registering...</ConfirmButtonText>
                </>
              )
            default:
              return <ConfirmButtonText>complete purchase</ConfirmButtonText>
          }
        })()}
      </Button>
    </ConfirmButtonStack>
  )
}

//@todo this error tooltip can be used in other places. Abstact it up the tree
const ConfirmButtonError = ({
  children,
  onPress,
  buttonText,
  ...props
}: ButtonProps & { buttonText?: string }) => {
  const media = useMedia()
  return (
    <Tooltip open={true} placement={media.gtMd ? 'right' : 'bottom'}>
      <Tooltip.Content
        enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        scale={1}
        x={0}
        y={0}
        opacity={1}
        animation={[
          'quick',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
        boc={'$red500'}
        borderWidth={1}
        maw={300}
        $theme-dark={{ bc: '$black' }}
        $theme-light={{ bc: '$gray4Light' }}
      >
        <Tooltip.Arrow borderColor={'$red500'} bw={4} />
        {children}
      </Tooltip.Content>
      <Tooltip.Trigger>
        <Button theme="green" borderRadius={'$4'} p={'$4'} onPress={onPress} {...props}>
          <ConfirmButtonText>{buttonText || 'error'}</ConfirmButtonText>
          <ButtonIcon>
            <AlertTriangle color={'$error'} size={'$1'} />
          </ButtonIcon>
        </Button>
      </Tooltip.Trigger>
    </Tooltip>
  )
}

function ConfirmButtonText({ children }: PropsWithChildren) {
  return (
    <ButtonText ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'} color={'$black'}>
      {children}
    </ButtonText>
  )
}

function ConfirmButtonStack(props: YStackProps) {
  return <YStack jc="center" width="100%" {...props} />
}
