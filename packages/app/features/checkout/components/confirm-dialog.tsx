import {
  Adapt,
  Anchor,
  AnimatePresence,
  Button,
  Dialog,
  Fieldset,
  Label,
  Paragraph,
  ScrollView,
  Sheet,
  Spinner,
  Theme,
  TooltipSimple,
  Unspaced,
  XStack,
  YStack,
  YStackProps,
} from '@my/ui'
import { baseMainnet, baseMainnetClient, sendRevenueSafeAddress } from '@my/wagmi'
import { CheckCircle, X } from '@tamagui/lucide-icons'
import { TRPCClientError } from '@trpc/client'
import { api } from 'app/utils/api'
import { getXPostHref } from 'app/utils/getReferralLink'
import { shorten } from 'app/utils/strings'
import { useConfirmedTags, usePendingTags } from 'app/utils/tags'
import { useChainAddresses } from 'app/utils/useChainAddresses'
import { useMounted } from 'app/utils/useMounted'
import { useReceipts } from 'app/utils/useReceipts'
import { useUser } from 'app/utils/useUser'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLink } from 'solito/link'
import { formatEther } from 'viem'
import {
  useAccount,
  useBlockNumber,
  useConnect,
  useEstimateGas,
  usePublicClient,
  useSendTransaction,
  useSignMessage,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { getPriceInWei, getSenderSafeReceivedEvents, verifyAddressMsg } from '../screen'
import { assert } from 'app/utils/assert'

export interface ConfirmContextType {
  open: boolean
  closeable: boolean
  setCloseable: (closeable: boolean) => void
  onConfirmed: () => void
}

export const ConfirmContext = createContext<ConfirmContextType>(
  null as unknown as ConfirmContextType
)

const Provider = ({
  children,
  closeable,
  setCloseable,
  open,
  onConfirmed,
}: { children: React.ReactNode } & ConfirmContextType) => {
  return (
    <ConfirmContext.Provider
      value={{
        closeable,
        setCloseable,
        open,
        onConfirmed,
      }}
    >
      {children}
    </ConfirmContext.Provider>
  )
}

export const useConfirmContext = () => {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirmContext must be used within a ConfirmContext.Provider')
  }
  return ctx
}

export function ConfirmDialog({
  onConfirmed,
  needsVerification,
}: {
  onConfirmed: () => void
  needsVerification: boolean
}) {
  const pendingTags = usePendingTags()
  const confirmedTags = useConfirmedTags()
  const hasPendingTags = pendingTags && pendingTags?.length > 0
  const [open, setOpen] = useState(false)
  const [closeable, setCloseable] = useState(true)
  const handleOpenChange = (open: boolean) => {
    if (!closeable && !open) return
    setOpen(open)
  }
  const weiAmount = useMemo(
    () => getPriceInWei(pendingTags ?? [], confirmedTags ?? []),
    [pendingTags, confirmedTags]
  )
  const ethAmount = useMemo(() => formatEther(weiAmount), [weiAmount])

  // when not closeable prevent browser navigation
  useEffect(() => {
    if (!closeable) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (confirm('You have a pending Send Tag transaction. Are you sure you want to leave?')) {
          return
        }
        e.preventDefault()
        e.returnValue = ''
        return
      }
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }
  }, [closeable])

  return (
    <Dialog modal open={open} onOpenChange={handleOpenChange}>
      <YStack width="100%">
        {(hasPendingTags || needsVerification) && (
          <YStack
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            space="$2"
            w="100%"
            flex={1}
          >
            <YStack maxWidth={600} width="100%">
              {BigInt(weiAmount) > 0 && (
                <Paragraph maw="100%" ta="right">
                  Total: {ethAmount} ETH
                </Paragraph>
              )}
              <Dialog.Trigger asChild>
                <Button
                  disabled={!needsVerification && (pendingTags ?? []).length === 0}
                  space="$1.5"
                  icon={CheckCircle}
                  f={1}
                  width="100%"
                >
                  {needsVerification ? 'Verify' : 'Confirm'}
                </Button>
              </Dialog.Trigger>
            </YStack>
          </YStack>
        )}
      </YStack>

      <Adapt when="sm" platform="touch">
        <Sheet
          zIndex={200000}
          open={open}
          modal
          dismissOnOverlayPress={false}
          onOpenChange={handleOpenChange}
        >
          <Sheet.Frame padding="$4" gap="$4">
            <Adapt.Contents />
          </Sheet.Frame>
          <Button
            position="absolute"
            top="$1.5"
            right="$1.5"
            size="$2"
            circular
            icon={X}
            onPress={() => {
              if (closeable) setOpen(false)
            }}
          />
          <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        </Sheet>
      </Adapt>

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
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$4"
          maw={400}
          miw="$20"
        >
          <Provider
            open={open}
            closeable={closeable}
            setCloseable={setCloseable}
            onConfirmed={onConfirmed}
          >
            <Dialog.Title size="$8">Confirming Send Tags</Dialog.Title>
            <AnimatePresence>
              <ConfirmFlow />
            </AnimatePresence>
            <ConfirmCloseDialog />
          </Provider>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export function ConfirmFlow() {
  const { isConnected, chainId } = useAccount()
  const { connect, connectors, error: connectError } = useConnect()
  const { switchChain } = useSwitchChain()
  const { isLoadingTags } = useUser()

  if (isLoadingTags) {
    return (
      <ConfirmDialogContent>
        <Dialog.Description>Checking your Send Tags...</Dialog.Description>
        <Spinner color="$color11" />
      </ConfirmDialogContent>
    )
  }

  if (!isConnected) {
    return (
      <ConfirmDialogContent>
        <Dialog.Description>
          Please connect your wallet to confirm your Send Tags.
        </Dialog.Description>
        <Button
          w="100%"
          onPress={() => {
            assert(!!connectors[0], 'No connectors found')
            connect({ connector: connectors[0] })
          }}
        >
          Connect Wallet
        </Button>
        <AnimatePresence>
          {connectError && (
            <ScrollView
              key="connectError"
              h={'$10'}
              animateOnly={['transform', 'opacity']}
              animation={[
                'quick',
                {
                  opacity: {
                    overshootClamping: true,
                  },
                },
              ]}
              enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
              exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            >
              <Paragraph maw="100%" theme="error">
                {connectError.message.includes('Connector not found')
                  ? 'Please install a web3 wallet like MetaMask.'
                  : connectError.message}
              </Paragraph>
            </ScrollView>
          )}
        </AnimatePresence>
      </ConfirmDialogContent>
    )
  }

  if (baseMainnet.id !== chainId) {
    return (
      <ConfirmDialogContent>
        <Dialog.Description>Please switch to {baseMainnet.name} in your wallet.</Dialog.Description>
        <Theme name="error">
          <Button
            onPress={() => {
              assert(!!switchChain, 'switchChain is required')
              switchChain({ chainId: baseMainnet.id }, { onError: console.error })
            }}
          >
            Switch Network
          </Button>
        </Theme>
      </ConfirmDialogContent>
    )
  }

  return <ConfirmWithVerifiedAddress />
}

export function ConfirmWithVerifiedAddress() {
  const publicClient = usePublicClient()
  const verify = api.chainAddress.verify.useMutation()
  const {
    data: addresses,
    isLoading: isLoadingAddresses,
    refetch: updateAddresses,
  } = useChainAddresses()
  const { address: connectedAddress, status } = useAccount()
  const { signMessageAsync, error: signMsgErr } = useSignMessage()
  const address = addresses?.[0]?.address // this only works cause we limit to 1 address
  const savedAddress = useMemo(() => address, [address])
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (status === 'connected' || status === 'disconnected') {
      setError(undefined)
    }
  }, [status])

  if (isLoadingAddresses || !connectedAddress) {
    return (
      <ConfirmDialogContent>
        <Dialog.Description>Checking your wallet address...</Dialog.Description>
        <Spinner color="$color11" />
      </ConfirmDialogContent>
    )
  }

  if (savedAddress && savedAddress !== connectedAddress) {
    return (
      <ConfirmDialogContent>
        <Dialog.Description>Your account already has a verified address.</Dialog.Description>
        <TooltipSimple label={savedAddress}>
          <Paragraph>
            Please switch to the wallet address{' '}
            <Anchor
              href={`${
                publicClient?.chain?.blockExplorers?.default?.url ?? ''
              }/address/${savedAddress}`}
              target="_blank"
            >
              {shorten(savedAddress)}
            </Anchor>{' '}
            you verified earlier.
          </Paragraph>
        </TooltipSimple>
      </ConfirmDialogContent>
    )
  }

  if (!savedAddress) {
    // ensure the user has verified their address
    return (
      <ConfirmDialogContent>
        <Dialog.Description>
          Please press Sign Message to verify your wallet address,{' '}
          <Anchor
            href={`${
              publicClient?.chain?.blockExplorers?.default.url ?? ''
            }/address/${connectedAddress}`}
            target="_blank"
          >
            {shorten(connectedAddress)}.
          </Anchor>
        </Dialog.Description>
        <Paragraph>
          You can only verify one wallet address and it cannot be changed for now.
        </Paragraph>
        <Theme>
          <Button
            onPress={() => {
              assert(!!signMessageAsync, 'signMessageAsync is required')
              assert(!!connectedAddress, 'connectedAddress is required')
              signMessageAsync({ message: verifyAddressMsg(connectedAddress) })
                .then((signature) => verify.mutateAsync({ address: connectedAddress, signature }))
                .then(() => updateAddresses())
                .catch((e) => {
                  if (e instanceof TRPCClientError) {
                    setError(e.message)
                  } else {
                    console.error(e)
                    setError('Something went wrong')
                  }
                })
            }}
          >
            Sign Message
          </Button>
        </Theme>

        <AnimatePresence>
          {(signMsgErr || error) && (
            <ScrollView
              key="signMsgErr"
              h={'$10'}
              animateOnly={['transform', 'opacity']}
              animation={[
                'quick',
                {
                  opacity: {
                    overshootClamping: true,
                  },
                },
              ]}
              enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
              exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            >
              <Paragraph maw="100%" theme="error">
                {error ? `${error} ` : ''}
                {signMsgErr && 'details' in signMsgErr ? signMsgErr?.details : signMsgErr?.message}
              </Paragraph>
            </ScrollView>
          )}
        </AnimatePresence>
      </ConfirmDialogContent>
    )
  }

  return <ConfirmWithSignTransaction />
}

export function ConfirmWithSignTransaction() {
  const { isLoadingTags, updateProfile, profile } = useUser()
  const pendingTags = usePendingTags()
  const confirmedTags = useConfirmedTags()
  const { refetch: refetchReceipts } = useReceipts()
  const ethAmount = getPriceInWei(pendingTags ?? [], confirmedTags ?? [])
  const confirm = api.tag.confirm.useMutation()
  const { chain } = useAccount()
  const [sentTx, setSentTx] = useState<`0x${string}`>()
  const { data: txReceipt, error: txWaitError } = useWaitForTransactionReceipt({
    hash: sentTx,
    confirmations: 2,
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string>()
  const [confirmed, setConfirmed] = useState(false)
  const isFree = ethAmount === BigInt(0)
  const paidOrFree = (pendingTags ?? []).length > 0 && (isFree || txReceipt)
  const mounted = useMounted()
  const { open, setCloseable, onConfirmed } = useConfirmContext()
  const referralLink = useLink({
    href: getXPostHref(profile?.referral_code ?? ''),
  })
  const [attempts, setAttempts] = useState(0)
  const reset = useCallback(() => {
    setConfirmed(false)
    setSubmitted(false)
    setSentTx(undefined)
    setError(undefined)
    confirm.reset()
  }, [confirm])

  // handle sending confirmation to the server
  useEffect(() => {
    if (!mounted) return
    if (submitted) return
    if (confirmed) return
    if (isLoadingTags) return
    if (!isFree && !sentTx) return
    if (!pendingTags || pendingTags.length === 0) return
    if (confirm.isPending) return
    if (paidOrFree) {
      setSubmitted(true)
      setAttempts((a) => a + 1)
      confirm
        .mutateAsync(isFree ? {} : { transaction: sentTx })
        .then(async () => {
          setConfirmed(true)
          setCloseable(true)
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
                `Transaction with hash "${sentTx}" could not be found`,
              ].some((s) => err.message.includes(s)) &&
              attempts < 10
            ) {
              // try again
              setTimeout(() => {
                reset()
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
  }, [
    mounted,
    confirmed,
    paidOrFree,
    submitted,
    isLoadingTags,
    isFree,
    sentTx,
    confirm,
    updateProfile,
    pendingTags,
    setCloseable,
    onConfirmed,
    refetchReceipts,
    attempts,
    reset,
  ])

  // biome-ignore lint/correctness/useExhaustiveDependencies: run when confirmed and submitted changes
  useEffect(() => {
    if (confirmed) {
      setCloseable(true)
    }
  }, [confirmed, submitted, setCloseable])

  // reset state when closing
  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  if (confirmed) {
    return (
      <ConfirmDialogContent>
        <Dialog.Description>Send Tags are confirmed.</Dialog.Description>
        {txReceipt && (
          <YStack space="$2">
            <Paragraph maw="100%">
              Confirmed transaction using{' '}
              {chain ? (
                <Anchor
                  href={`${chain.blockExplorers.default.url}/tx/${txReceipt.transactionHash}`}
                >
                  {shorten(txReceipt.transactionHash, 7, 3)}
                </Anchor>
              ) : (
                shorten(txReceipt.transactionHash, 7, 3)
              )}
            </Paragraph>
          </YStack>
        )}
        <Button {...referralLink}>X Post Referral Link</Button>
      </ConfirmDialogContent>
    )
  }

  // show confirming and loading until hooks run
  if (pendingTags === undefined || isLoadingTags) {
    return (
      <ConfirmDialogContent>
        <Dialog.Description>
          Pardon the interruption, we are loading your Send Tags...
        </Dialog.Description>
        <Spinner color="$color11" />
      </ConfirmDialogContent>
    )
  }

  if (pendingTags?.length === 0 && !confirmed) {
    return (
      <ConfirmDialogContent>
        <Dialog.Description>
          You have no Send Tags to confirm. Please add some Send Tags.
        </Dialog.Description>
      </ConfirmDialogContent>
    )
  }

  if (!isFree && !sentTx) {
    return (
      <ConfirmSendTransaction
        onSent={(tx) => {
          if (tx) setCloseable(false) // don't allow closing while waiting for tx
          setSentTx(tx)
        }}
      />
    )
  }

  return (
    <ConfirmDialogContent space="$2">
      <YStack space="$2">
        {!isFree && (
          <Paragraph mx="auto" maw="100%">
            Sent transaction...{' '}
            {chain ? (
              <Anchor href={`${chain.blockExplorers.default.url}/tx/${sentTx}`}>
                {shorten(sentTx, 7, 3)}
              </Anchor>
            ) : (
              shorten(sentTx, 7, 3)
            )}
          </Paragraph>
        )}
        {!error && (
          <XStack space="$2" jc="center" ai="center">
            {!confirm.isPending && <Paragraph>Awaiting transaction confirmation...</Paragraph>}
            {submitted && confirm.isPending && <Paragraph>Confirming Send Tags...</Paragraph>}
            <Spinner color="$color10" />
          </XStack>
        )}
      </YStack>
      <AnimatePresence>
        {error && (
          <ScrollView
            h={'$10'}
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          >
            <Paragraph maw="100%" theme="error">
              {error} {txWaitError?.message}
            </Paragraph>
            <Button
              onPress={() => {
                reset()
              }}
            >
              Try Again
            </Button>
          </ScrollView>
        )}
      </AnimatePresence>
    </ConfirmDialogContent>
  )
}

export function ConfirmSendTransaction({ onSent }: { onSent: (tx: `0x${string}`) => void }) {
  const publicClient = usePublicClient()
  const { address } = useAccount()
  const { receipts, error: errorReceipts, isLoading: isLoadingReceipts } = useReceipts()
  const pendingTags = usePendingTags()
  const confirmedTags = useConfirmedTags()
  const ethAmount = getPriceInWei(pendingTags ?? [], confirmedTags ?? [])

  const tx = {
    to: sendRevenueSafeAddress,
    value: ethAmount,
  } as const
  const { data: txData, error: sendTxErr, isLoading } = useEstimateGas(tx)
  const { sendTransactionAsync } = useSendTransaction()
  const [error, setError] = useState<string>()
  const receiptHashes = useMemo(() => receipts?.map((r) => r.hash) ?? [], [receipts])
  const { data: block } = useBlockNumber()

  const lookupSafeReceivedEvent = useCallback(async () => {
    if (!address) return
    if (isLoadingReceipts) return
    if (receipts === undefined) return
    if (!publicClient) return
    const events = await getSenderSafeReceivedEvents({
      publicClient: publicClient as typeof baseMainnetClient,
      sender: address,
    })
    const event = events.filter(
      (e) => e.args.value === ethAmount && !receiptHashes.includes(e.transactionHash)
    )?.[0]
    // check it against the receipts
    if (event?.transactionHash) {
      onSent(event.transactionHash)
    }
  }, [receipts, publicClient, address, ethAmount, onSent, isLoadingReceipts, receiptHashes])

  // watch for new receipts
  // biome-ignore lint/correctness/useExhaustiveDependencies: run when block changes
  useEffect(() => {
    lookupSafeReceivedEvent()
  }, [block, lookupSafeReceivedEvent])

  return (
    <ConfirmDialogContent>
      <Dialog.Description>
        Press Sign Transaction below to confirm your Send Tags and sign the transaction in your
        wallet.
      </Dialog.Description>
      <Fieldset gap="$4" horizontal>
        <Label width={50} htmlFor="from">
          From
        </Label>
        <Paragraph>
          <Anchor
            // @ts-expect-error tamagui doesn't support this yet
            title={address}
            target="_blank"
            href={`${baseMainnet.blockExplorers?.default.url}/address/${address}`}
          >
            {shorten(address)}
          </Anchor>
        </Paragraph>
      </Fieldset>
      <Fieldset gap="$4" horizontal>
        <Label width={50} htmlFor="from">
          To
        </Label>
        <Paragraph>
          <Anchor
            // @ts-expect-error tamagui doesn't support this yet
            title={address}
            target="_blank"
            href={`${baseMainnet.blockExplorers?.default.url}/address/${sendRevenueSafeAddress}`}
          >
            Send Tag Safe
          </Anchor>
        </Paragraph>
      </Fieldset>
      <Fieldset gap="$4" horizontal>
        <Label width={50}>Total</Label>
        <Paragraph>{formatEther(ethAmount).toLocaleString()} ETH</Paragraph>
      </Fieldset>

      <Button
        disabled={isLoading}
        iconAfter={
          <AnimatePresence>
            {isLoading && (
              <Spinner
                color="$color"
                key="loading-spinner"
                opacity={1}
                y={0}
                animation="quick"
                enterStyle={{
                  opacity: 0,
                  y: 4,
                }}
                exitStyle={{
                  opacity: 0,
                  y: 4,
                }}
              />
            )}
          </AnimatePresence>
        }
        onPress={() => {
          assert(!!sendTransactionAsync, 'sendTransactionAsync is required')
          sendTransactionAsync({
            gas: txData,
            ...tx,
          })
            .then((hash) => {
              onSent(hash)
            })
            .catch((err) => {
              console.error(err)
              setError('Something went wrong')
            })
        }}
      >
        Sign Transaction
      </Button>
      <AnimatePresence>
        {!!(sendTxErr || error || errorReceipts) && (
          <ScrollView
            key="sendTxErr"
            h={'$10'}
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            maw="100%"
          >
            <Paragraph theme="error">
              {error ? `${error} ` : ''}
              {errorReceipts instanceof Error ? `${errorReceipts?.message} ` : ''}
              {sendTxErr && 'details' in sendTxErr ? sendTxErr?.details : sendTxErr?.message}
            </Paragraph>
          </ScrollView>
        )}
      </AnimatePresence>
    </ConfirmDialogContent>
  )
}

export function ConfirmCloseDialog() {
  const { closeable } = useConfirmContext()
  return (
    <Unspaced>
      {closeable && (
        <Dialog.Close asChild>
          <Button
            position="absolute"
            top="$1.5"
            right="$1.5"
            size="$2"
            circular
            icon={X}
            aria-label="Close"
          />
        </Dialog.Close>
      )}
    </Unspaced>
  )
}

export function ConfirmDialogContent({
  children,
  ...props
}: { children: React.ReactNode } & YStackProps) {
  return (
    <YStack
      animateOnly={['transform', 'opacity']}
      animation={[
        'quick',
        {
          opacity: {
            overshootClamping: true,
          },
        },
      ]}
      enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
      exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
      gap="$4"
      {...props}
    >
      {children}
    </YStack>
  )
}
