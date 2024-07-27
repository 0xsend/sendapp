import {
  Button,
  ButtonIcon,
  ButtonText,
  Paragraph,
  Spinner,
  Tooltip,
  YStack,
  useMedia,
  type ButtonProps,
  type YStackProps,
} from '@my/ui'
import { baseMainnetClient, usdcAddress } from '@my/wagmi'
import { AlertTriangle, CheckCircle } from '@tamagui/lucide-icons'
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
import { useUser } from 'app/utils/useUser'
import { sendUserOpTransfer } from 'app/utils/useUserOpTransferMutation'
import { useAccountNonce } from 'app/utils/userop'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatUnits, isAddressEqual, zeroAddress } from 'viem'
import { useBalance, useWaitForTransactionReceipt } from 'wagmi'
import {
  useReferralReward,
  useReferrer,
  useSendtagCheckout,
  useSendtagCheckoutReceipts,
} from '../checkout-utils'

export function ConfirmButton({
  onConfirmed,
}: {
  onConfirmed: () => void
}) {
  const media = useMedia()
  const { updateProfile } = useUser()
  const { data: sendAccount } = useSendAccount()
  const sender = useMemo(() => sendAccount?.address, [sendAccount?.address])

  const chainId = baseMainnetClient.chain.id
  const pendingTags = usePendingTags() ?? []
  const amountDue = useMemo(() => total(pendingTags ?? []), [pendingTags])
  const { data: referrerProfile } = useReferrer()
  const { data: rewardDue } = useReferralReward({ tags: pendingTags })

  const webauthnCreds =
    sendAccount?.send_account_credentials
      .filter((c) => !!c.webauthn_credentials)
      .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? []
  const hasPendingTags = !!pendingTags?.length
  const {
    data: balance,
    isLoading: isLoadingBalance,
    error: balanceError,
    queryKey: [balanceQueryKey],
  } = useBalance({
    address: sender,
    chainId: baseMainnetClient.chain.id,
    token: usdcAddress[chainId],
  })

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
        const invalidReferrer =
          (!referrerProfile && rewardSent !== 0n) || // no referrer and reward is sent
          (referrerProfile && rewardSent !== rewardDue) || // referrer and invalid reward
          (rewardSent > 0n && !isAddressEqual(referrerProfile?.address ?? zeroAddress, referrer)) // referrer and reward sent is not the correct referrer

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
  const [confirmed, setConfirmed] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const { userOp, userOpError, isLoadingUserOp, usdcFees, usdcFeesError, isLoadingUSDCFees } =
    useSendtagCheckout()
  const canAffordTags =
    balance && usdcFees && balance.value + usdcFees.baseFee + usdcFees.gasFees >= amountDue

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
      queryClient.invalidateQueries({ queryKey: [balanceQueryKey] })
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
        setConfirmed(true)
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

  const possibleErrors = [checkoutErrors, userOpError, usdcFeesError]

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
                .filter((e) => e?.message)
                .map((e) => e?.message.split('.').at(0))
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

  if (!hasPendingTags && !confirmed) {
    return (
      <ConfirmButtonStack>
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
            $theme-dark={{ bc: '$black' }}
            $theme-light={{ bc: '$white' }}
          >
            <Tooltip.Arrow borderColor={'$red500'} bw={4} />
            <Paragraph $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
              You have no Send Tags to confirm. Please add some Send Tags.
            </Paragraph>
          </Tooltip.Content>
        </Tooltip>
      </ConfirmButtonStack>
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
    !isLoadingUSDCFees

  return (
    <ConfirmButtonStack ai="center" $gtMd={{ ai: 'flex-start' }} mx="auto" gap="$2">
      {balanceError && (
        <Paragraph color="$error">{balanceError?.message?.split('.').at(0)}</Paragraph>
      )}
      {usdcFeesError && (
        <Paragraph color="$error">{usdcFeesError?.message?.split('.').at(0)}</Paragraph>
      )}
      {balance && (
        <Paragraph
          $theme-dark={{ col: '$gray9Light' }}
          $theme-light={{ col: '$gray9Dark' }}
          fontWeight={'500'}
          fontSize={'$5'}
        >
          Your balance: {formatUnits(balance.value, 6)} USDC
        </Paragraph>
      )}
      <Button
        width={'$16'}
        disabled={!canSubmit}
        disabledStyle={{
          bc: '$gray5Light',
          pointerEvents: 'none',
          opacity: 0.5,
        }}
        gap="$1.5"
        onPress={handleCheckoutTx}
        br={12}
        f={1}
      >
        {(() => {
          switch (true) {
            case isLoadingUserOp || isLoadingBalance || isLoadingUSDCFees || isLoadingReceipts:
              return (
                <>
                  <Spinner color="$color11" />
                  <ButtonText p="$2">Loading...</ButtonText>
                </>
              )
            case !canAffordTags && (!txWaitLoading || !submitting):
              return <ButtonText>Insufficient funds</ButtonText>
            case sendTransactionIsPending:
              return (
                <>
                  <Spinner color="$color11" />
                  <ButtonText p="$2">Requesting...</ButtonText>
                </>
              )
            case txWaitLoading:
              return (
                <>
                  <Spinner color="$color11" />
                  <ButtonText p="$2">Processing...</ButtonText>
                </>
              )
            case submitting:
              return (
                <>
                  <Spinner color="$color11" />
                  <ButtonText p="$2">Registering...</ButtonText>
                </>
              )
            default:
              return (
                <>
                  <ButtonIcon>
                    <CheckCircle />
                  </ButtonIcon>
                  <ButtonText p="$2">Confirm</ButtonText>
                </>
              )
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
        <Button gap="$1.5" onPress={onPress} br={12} f={1} {...props}>
          <ButtonText gap="$1.5">{buttonText || 'Error'}</ButtonText>
          <ButtonIcon>
            <AlertTriangle color={'$red500'} />
          </ButtonIcon>
        </Button>
      </Tooltip.Trigger>
    </Tooltip>
  )
}

function ConfirmButtonStack(props: YStackProps) {
  return <YStack jc="center" width="100%" {...props} />
}
