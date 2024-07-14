import type { Database } from '@my/supabase/database.types'
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
import {
  baseMainnetClient,
  erc20Abi,
  sendtagCheckoutAbi,
  sendtagCheckoutAddress,
  usdcAddress,
} from '@my/wagmi'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AlertTriangle, CheckCircle } from '@tamagui/lucide-icons'
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { TRPCClientError } from '@trpc/client'
import { total } from 'app/data/sendtags'
import { api } from 'app/utils/api'
import { assert } from 'app/utils/assert'
import { byteaToHex } from 'app/utils/byteaToHex'
import { hexToBytea } from 'app/utils/hexToBytea'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { usePendingTags } from 'app/utils/tags'
import { throwIf } from 'app/utils/throwIf'
import { useReceipts } from 'app/utils/useReceipts'
import { useUser } from 'app/utils/useUser'
import { sendUserOpTransfer } from 'app/utils/useUserOpTransferMutation'
import { useUserOp } from 'app/utils/userop'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { checksumAddress, encodeFunctionData, formatUnits, zeroAddress } from 'viem'
import { useBalance, useWaitForTransactionReceipt } from 'wagmi'

function useReferrer() {
  // TODO: use referrer from cookie
  return useQuery({
    queryKey: ['referrer'],
    queryFn: () => {
      return zeroAddress
    },
  })
}

function useReferralBonus() {
  // TODO: use referrer from cookie
  return useQuery({
    queryKey: ['bonus'],
    queryFn: () => {
      return 0n
    },
  })
}

export function fetchSendtagCheckoutTransfers(supabase: SupabaseClient<Database>) {
  return supabase
    .from('send_account_transfers')
    .select(`
      event_id,
      f,
      t,
      v::text,
      tx_hash
    `)
    .eq('t', hexToBytea(sendtagCheckoutAddress[baseMainnetClient.chain.id]))
}

function sendtagCheckoutTransfersQueryOptions(supabase: SupabaseClient<Database>) {
  return queryOptions({
    queryKey: ['sendtag_checkout_transfers', supabase] as const,
    queryFn: async ({ queryKey: [, supabase] }) => {
      const { data, error } = await fetchSendtagCheckoutTransfers(supabase)
      throwIf(error)
      return data
    },
    refetchInterval: 1000 * 10,
  })
}

function useSendtagCheckoutTransfers() {
  const supabase = useSupabase()
  return useQuery(sendtagCheckoutTransfersQueryOptions(supabase))
}

export function ConfirmButton({
  onConfirmed,
}: {
  onConfirmed: () => void
}) {
  const media = useMedia()
  const { updateProfile } = useUser()
  const { data: sendAccount } = useSendAccount()
  const sender = useMemo(() => sendAccount?.address, [sendAccount?.address])
  const webauthnCreds =
    sendAccount?.send_account_credentials
      .filter((c) => !!c.webauthn_credentials)
      .map((c) => c.webauthn_credentials as NonNullable<typeof c.webauthn_credentials>) ?? []
  const chainId = baseMainnetClient.chain.id
  const pendingTags = usePendingTags()
  const hasPendingTags = !!pendingTags?.length
  const {
    data: balance,
    isLoading: isLoadingBalance,
    error: balanceError,
  } = useBalance({
    address: sender,
    chainId: baseMainnetClient.chain.id,
    token: usdcAddress[chainId],
  })
  const amountDue = useMemo(() => total(pendingTags ?? []), [pendingTags])
  const { data: referrer } = useReferrer()
  const { data: bonus } = useReferralBonus()
  const canAffordTags = balance && balance.value >= amountDue
  const [submitting, setSubmitting] = useState(false)
  const confirm = api.tag.confirm.useMutation()
  const { receipts, refetch: refetchReceipts, isLoading: isLoadingReceipts } = useReceipts()
  const receiptEventIds = useMemo(() => receipts?.map((r) => r.event_id) ?? [], [receipts])
  const [sentTx, setSentTx] = useState<`0x${string}`>()
  const {
    data: transfers,
    error: transfersError,
    dataUpdatedAt: transfersUpdatedAt,
  } = useSendtagCheckoutTransfers()
  const [transfersLastFectched, setTransfersLastFectched] = useState(transfersUpdatedAt)
  console.log('transfers', transfers)
  const lookupSendtagCheckout = useCallback(async () => {
    if (!sender) return
    if (isLoadingReceipts) return
    if (receipts === undefined) return
    if (!transfers) return
    if (submitting) return
    if (error) return
    const event = transfers
      ?.filter((e) => {
        const _sender = checksumAddress(sender)
        const from = byteaToHex(e.f as `\\x${string}`)
        const to = byteaToHex(e.t as `\\x${string}`)
        const hash = byteaToHex(e.tx_hash as `\\x${string}`)
        const v = BigInt(e.v)
        const isPurchase =
          checksumAddress(from) === _sender && // check the correct sender
          checksumAddress(to) === sendtagCheckoutAddress[chainId] && // check the correct receiver
          v === amountDue && // check the correct amount
          !receiptEventIds.includes(e.event_id) && // don't double submit
          (!sentTx || sentTx === hash) // use the most recent tx if available

        console.log('isPurchase', isPurchase)
        console.log('from', from)
        console.log('to', to)
        console.log('hash', hash)
        console.log('v', e.v)
        console.log('amountDue', amountDue)
        console.log('receiptEventIds', receiptEventIds)
        console.log('sentTx', sentTx)
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
    transfers,
    confirm,
    amountDue,
    sentTx,
    chainId,
    receiptEventIds,
    submitting,
  ])

  useEffect(() => {
    if (transfers?.length && transfersUpdatedAt !== transfersLastFectched) {
      lookupSendtagCheckout().catch((e) => {
        console.error('Error looking up safe received events', e)
      })
      setTransfersLastFectched(transfersUpdatedAt)
    }
  }, [transfers, lookupSendtagCheckout, transfersUpdatedAt, transfersLastFectched])

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
  const calls = useMemo(
    () => [
      {
        dest: usdcAddress[chainId],
        value: 0n,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [sendtagCheckoutAddress[chainId], amountDue],
        }),
      },
      {
        dest: sendtagCheckoutAddress[chainId],
        value: 0n,
        data: encodeFunctionData({
          abi: sendtagCheckoutAbi,
          functionName: 'checkout',
          args: [amountDue, referrer ?? zeroAddress, bonus ?? 0n],
        }),
      },
    ],
    [amountDue, chainId, referrer, bonus]
  )
  const {
    data: userOp,
    error: userOpError,
    isLoading: isLoadingUserOp,
  } = useUserOp({
    sender,
    calls,
  })

  const { mutateAsync: sendUserOp, isPending: sendTransactionIsPending } = useMutation({
    mutationFn: sendUserOpTransfer,
    onSuccess: (userOpReceipt) => {
      if (userOpReceipt.success) {
        setSentTx(userOpReceipt.receipt.transactionHash)
      } else {
        setError(`Something went wrong: ${userOpReceipt.receipt.transactionHash}`)
      }
    },
  })

  async function handleCheckoutTx() {
    try {
      throwIf(userOpError)
      assert(!!userOp, 'User op is required')
      await sendUserOp({ userOp, webauthnCreds })
    } catch (e) {
      console.error(e)
      setError(e.message?.split('.').at(0))
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

          return
        }
        console.error(err)
        setError(err?.message?.split('.').at(0) ?? 'Something went wrong')
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

  const possibleErrors = [transfersError, userOpError]

  if (possibleErrors.some((e) => e?.message)) {
    if (__DEV__) {
      console.error('possibleErrors', possibleErrors)
    }
    return (
      <ConfirmButtonStack>
        <ConfirmButtonError>
          <YStack gap="$2" ai="center">
            <Paragraph $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
              {possibleErrors
                .filter((e) => e?.message)
                .map((e) => e?.message)
                .join(', ')}
            </Paragraph>
          </YStack>
        </ConfirmButtonError>
      </ConfirmButtonStack>
    )
  }

  if (error && !(submitting || sendTransactionIsPending || txWaitLoading)) {
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
    !txWaitLoading

  return (
    <ConfirmButtonStack ai="center" $gtMd={{ ai: 'flex-start' }} mx="auto" gap="$2">
      {isLoadingBalance && (
        <Paragraph>
          <Spinner color="$color11" />
        </Paragraph>
      )}
      {balanceError && (
        <Paragraph color="$error">{balanceError?.message?.split('.').at(0)}</Paragraph>
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
            case isLoadingUserOp:
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
