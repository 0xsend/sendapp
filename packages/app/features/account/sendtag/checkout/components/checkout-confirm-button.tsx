import {
  Anchor,
  ButtonIcon,
  Spinner,
  Tooltip,
  type ButtonProps,
  useMedia,
  YStack,
  Paragraph,
  Button,
  ButtonText,
} from '@my/ui'

import { AlertTriangle, CheckCircle } from '@tamagui/lucide-icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getPriceInWei, getSenderSafeReceivedEvents, verifyAddressMsg } from '../checkout-utils'
import {
  useAccount,
  useBalance,
  useBlockNumber,
  useConnect,
  useEstimateGas,
  usePublicClient,
  useSendTransaction,
  useSignMessage,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { baseMainnetClient, sendRevenueSafeAddress } from '@my/wagmi'
import { assert } from 'app/utils/assert'
import { api } from 'app/utils/api'
import { shorten } from 'app/utils/strings'
import { TRPCClientError } from '@trpc/client'
import { useReceipts } from 'app/utils/useReceipts'
import { useConnectModal, useChainModal } from '@rainbow-me/rainbowkit'
import { usePendingTags } from 'app/utils/tags'
import { useUser } from 'app/utils/useUser'
import { useChainAddresses } from 'app/utils/useChainAddresses'

export function ConfirmButton({
  onConfirmed,
  needsVerification,
}: {
  onConfirmed: () => void
  needsVerification: boolean
}) {
  const media = useMedia()
  const { updateProfile } = useUser()

  //Connect
  const pendingTags = usePendingTags()

  const { chainId } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { openChainModal } = useChainModal()
  const { error: connectError } = useConnect()
  const publicClient = usePublicClient()
  const {
    data: addresses,
    isLoading: isLoadingAddresses,
    isRefetching: isRefetchingAddresses,
    refetch: updateAddresses,
  } = useChainAddresses()
  const { address: connectedAddress } = useAccount()
  const { data: ethBalance } = useBalance({
    address: connectedAddress,
    chainId: baseMainnetClient.chain.id,
  })
  const weiAmount = useMemo(() => getPriceInWei(pendingTags ?? []), [pendingTags])
  const canAffordTags = ethBalance && ethBalance.value >= weiAmount
  const [submitting, setSubmitting] = useState(false)
  const confirm = api.tag.confirm.useMutation()
  const { receipts, refetch: refetchReceipts, isLoading: isLoadingReceipts } = useReceipts()
  const receiptHashes = useMemo(() => receipts?.map((r) => r.hash) ?? [], [receipts])
  const [sentTx, setSentTx] = useState<`0x${string}`>()

  const { data: block } = useBlockNumber()
  const lookupSafeReceivedEvent = useCallback(async () => {
    if (!addresses || addresses.length === 0) return
    const address = addresses[0].address
    if (isLoadingReceipts) return
    if (receipts === undefined) return
    if (!publicClient) return

    const events = await getSenderSafeReceivedEvents({
      publicClient: publicClient as typeof baseMainnetClient,
      sender: address,
    })
    const event = events.filter(
      (e) => e.args.value === weiAmount && !receiptHashes.includes(e.transactionHash)
    )?.[0]

    // check it against the receipts
    if (event?.transactionHash) {
      submitTxToDb(event.transactionHash)
    }
  }, [receipts, publicClient, addresses, weiAmount, isLoadingReceipts, receiptHashes])

  useEffect(() => {
    if (block) {
      lookupSafeReceivedEvent()
    }
  }, [block, lookupSafeReceivedEvent])

  const {
    data: txReceipt,
    isLoading: txWaitLoading,
    error: txWaitError,
  } = useWaitForTransactionReceipt({
    hash: sentTx,
    confirmations: 2,
  })

  const [error, setError] = useState<string>()
  const [confirmed, setConfirmed] = useState(false)

  const [attempts, setAttempts] = useState(0)

  const { sendTransactionAsync, isPending: sendTransactionIsPending } = useSendTransaction({
    mutation: {
      onSuccess: setSentTx,
    },
  })

  const tx = {
    to: sendRevenueSafeAddress[chainId as keyof typeof sendRevenueSafeAddress],
    chainId: baseMainnetClient.chain.id,
    value: weiAmount,
  } as const

  const { data: txData, error: estimateGasErr } = useEstimateGas({
    ...tx,
    query: {
      enabled: chainId !== undefined && canAffordTags,
    },
  })

  function handleCheckoutTx() {
    assert(!!sendTransactionAsync, 'sendTransactionAsync is required')
    sendTransactionAsync({
      gas: txData,
      ...tx,
    }).catch((err) => {
      console.error(err)
      setError(err.message.split('.').at(0))
    })
  }

  function submitTxToDb(tx: string) {
    setAttempts((a) => a + 1)
    setSubmitting(true)
    confirm
      .mutateAsync({ transaction: tx })
      .then(async () => {
        setConfirmed(true)
        setSubmitting(false)
        // Is this comment still applicable after refactor?
        // FIXME: these prob should be passed in as props since the portal and app root do not share the same providers
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

          setError(err.message)
          return
        }
        console.error(err)
        setError('Something went wrong')
      })
  }

  useEffect(() => {
    if (txReceipt) submitTxToDb(txReceipt.transactionHash)
  }, [txReceipt])

  useEffect(() => {
    if (txWaitError) {
      setError(txWaitError.message)
    }
  }, [txWaitError])

  const { signMessageAsync } = useSignMessage({
    mutation: {
      onError: (err) => {
        setError('details' in err ? err?.details : err?.message)
      },
    },
  })

  const [savedAddress, setSavedAddress] = useState(addresses?.[0]?.address) //this only works cause we limit to 1 address\

  useEffect(() => {
    if (isLoadingAddresses || addresses?.length === 0) return
    setSavedAddress(addresses?.[0]?.address)
  }, [isLoadingAddresses, addresses])

  const verify = api.chainAddress.verify.useMutation()

  function handleVerify() {
    assert(!!signMessageAsync, 'signMessageAsync is required')
    assert(!!connectedAddress, 'connectedAddress is required')
    signMessageAsync({ message: verifyAddressMsg(connectedAddress) })
      .then((signature) => verify.mutateAsync({ address: connectedAddress, signature }))
      .then(() => updateAddresses())
      .then(({ data: addresses }) => {
        setSavedAddress(addresses?.[0].address)
      })
      .catch((e) => {
        if (e instanceof TRPCClientError) {
          setError(e.message)
        } else {
          console.error(e)
          setError('Something went wrong')
        }
      })
  }

  // @TODO: This is not native compatible
  //We will need to seperate this logic so that we can switch between web and native
  if (connectError?.message) {
    return (
      <ConfirmButtonError onPress={openConnectModal}>
        <YStack gap="$2" ai="center">
          <Paragraph $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
            {connectError?.message}
          </Paragraph>
        </YStack>
      </ConfirmButtonError>
    )
  }

  // @TODO: This is not native compatible
  // We will need to seperate this logic so that we can switch between web and native
  if (!connectedAddress) {
    return (
      <Button space="$1.5" onPress={openConnectModal} br={12} f={1}>
        <ButtonText space="$1.5">Connect Wallet</ButtonText>
        <ButtonIcon>
          <AlertTriangle color={'$red500'} />
        </ButtonIcon>
      </Button>
    )
  }

  if (chainId !== baseMainnetClient.chain.id) {
    return (
      <ConfirmButtonError buttonText={'Switch Network'} onPress={openChainModal}>
        <YStack gap="$2" ai="center">
          <Paragraph $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
            Please switch to Base to confirm your Send Tags.
          </Paragraph>
        </YStack>
      </ConfirmButtonError>
    )
  }

  if ((!savedAddress && !isRefetchingAddresses) || needsVerification) {
    return (
      <ConfirmButtonError buttonText={'Verify Wallet'} onPress={handleVerify}>
        <YStack gap="$2" ai="center">
          <Paragraph $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
            Please verify your wallet to confirm your Send Tags.
          </Paragraph>
        </YStack>
      </ConfirmButtonError>
    )
  }

  if (isRefetchingAddresses) {
    return (
      <>
        <Paragraph $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
          Checking your wallet address...
        </Paragraph>
        <Spinner color="$color11" />
      </>
    )
  }

  if (savedAddress && savedAddress !== connectedAddress) {
    return (
      <ConfirmButtonError disabled>
        <YStack gap="$2" ai="center">
          <Paragraph $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
            Please switch to the wallet address you verified earlier.
          </Paragraph>
          <Anchor
            $theme-dark={{ col: '$white' }}
            $theme-light={{ col: '$black' }}
            href={`${
              publicClient?.chain?.blockExplorers?.default?.url ?? ''
            }/address/${savedAddress}`}
            target="_blank"
          >
            {shorten(savedAddress)}
          </Anchor>
        </YStack>
      </ConfirmButtonError>
    )
  }

  if (error && !(submitting || sendTransactionIsPending || txWaitLoading)) {
    return (
      <ConfirmButtonError
        buttonText={'Retry'}
        onPress={() => {
          setError(undefined)
          switch (true) {
            case needsVerification || !savedAddress || connectedAddress !== savedAddress:
              handleVerify()
              break
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

  if (pendingTags?.length === 0 && !confirmed) {
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
          $theme-dark={{ bc: '$black' }}
          $theme-light={{ bc: '$white' }}
        >
          <Tooltip.Arrow borderColor={'$red500'} bw={4} />
          <Paragraph $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
            You have no Send Tags to confirm. Please add some Send Tags.
          </Paragraph>
        </Tooltip.Content>
      </Tooltip>
    )
  }

  return (
    <Button
      disabled={(!needsVerification && (pendingTags ?? []).length === 0) || !canAffordTags}
      disabledStyle={{
        bc: '$gray5Light',
        pointerEvents: 'none',
        opacity: 0.5,
      }}
      pointerEvents={submitting || txWaitLoading || sendTransactionIsPending ? 'none' : 'auto'}
      space="$1.5"
      onPress={handleCheckoutTx}
      br={12}
      f={1}
    >
      {(() => {
        switch (true) {
          case (!canAffordTags || estimateGasErr !== null) && (!txWaitLoading || !submitting):
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
        <Button space="$1.5" onPress={onPress} br={12} f={1} {...props}>
          <ButtonText space="$1.5">{buttonText || 'Error'}</ButtonText>
          <ButtonIcon>
            <AlertTriangle color={'$red500'} />
          </ButtonIcon>
        </Button>
      </Tooltip.Trigger>
    </Tooltip>
  )
}
