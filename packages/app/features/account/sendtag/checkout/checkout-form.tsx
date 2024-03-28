import {
  Anchor,
  AnimatePresence,
  Button,
  ButtonIcon,
  ButtonText,
  Label,
  Paragraph,
  Spinner,
  Stack,
  SubmitButton,
  Theme,
  Tooltip,
  XStack,
  YStack,
  useToastController,
  useMedia,
  type ButtonProps,
} from '@my/ui'

import { AlertTriangle, CheckCircle, X } from '@tamagui/lucide-icons'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useConfirmedTags, usePendingTags } from 'app/utils/tags'
import { useChainAddresses } from 'app/utils/useChainAddresses'
import { useTimeRemaining } from 'app/utils/useTimeRemaining'
import { useUser } from 'app/utils/useUser'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FormProvider, set, useForm } from 'react-hook-form'
import { formatEther } from 'viem'
import type { z } from 'zod'
import { ConfirmDialog } from './components/confirm-dialog'
import { CheckoutTagSchema } from './CheckoutTagSchema'
import { SendTagPricingDialog, SendTagPricingTooltip } from './SendTagPricingDialog'
import { getPriceInWei, maxNumSendTags, tagLengthToWei, verifyAddressMsg } from './checkout-utils'
import { IconPlus } from 'app/components/icons'
import {
  useAccount,
  useBalance,
  useConnect,
  useEstimateGas,
  usePublicClient,
  useSendTransaction,
  useSignMessage,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { baseMainnet, baseMainnetClient, sendRevenueSafeAddress } from '@my/wagmi'
import { assert } from 'app/utils/assert'
import { api } from 'app/utils/api'
import { shorten } from 'app/utils/strings'
import { TRPCClientError } from '@trpc/client'
import { useReceipts } from 'app/utils/useReceipts'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { OpenConnectModalWrapper } from 'app/utils/OpenConnectModalWrapper'
import { err } from 'react-native-svg'

export const CheckoutForm = () => {
  const user = useUser()
  const pendingTags = usePendingTags()
  const confirmedTags = useConfirmedTags()
  const hasPendingTags = pendingTags && pendingTags.length > 0
  const form = useForm<z.infer<typeof CheckoutTagSchema>>()
  const supabase = useSupabase()
  const toast = useToastController()
  const has5Tags = user?.tags?.length === 5
  const [needsVerification, setNeedsVerification] = React.useState(false)
  const media = useMedia()

  const { data: addresses } = useChainAddresses()

  async function createSendTag({ name }: z.infer<typeof CheckoutTagSchema>) {
    setNeedsVerification(false) // reset verification state

    if (!user.user) return console.error('No user')
    const { error } = await supabase.from('tags').insert({ name })

    if (error) {
      console.error("Couldn't create Sendtag", error)
      switch (error.code) {
        case '23505':
          form.setError('name', { type: 'custom', message: 'This Sendtag is already taken' })
          break
        case 'P0001':
          if (error.message?.includes(`You don't got the riz for the tag:`)) {
            setNeedsVerification(!!addresses && addresses.length === 0)
          }
          form.setError('name', {
            type: 'custom',
            message: error.message ?? 'Something went wrong',
          })
          break
        default:
          form.setError('name', {
            type: 'custom',
            message: error.message ?? 'Something went wrong',
          })
          break
      }
    } else {
      // form state is successfully submitted, show the purchase confirmation screen
      form.reset()
      user?.updateProfile()
    }
  }

  function onConfirmed() {
    user?.updateProfile()
  }

  return (
    <FormProvider {...form}>
      <SchemaForm
        form={form}
        onSubmit={createSendTag}
        schema={CheckoutTagSchema}
        defaultValues={{
          name: '',
        }}
        props={{
          name: {
            autoFocus: true,
            'aria-label': 'Sendtag name',
            placeholder: 'Enter Sendtag name',
          },
        }}
        formProps={{
          justifyContent: 'flex-start',
          f: 0,
          w: '100%',
          $gtMd: {
            als: 'flex-start',
          },
          borderBottomWidth: hasPendingTags ? 1 : 0,
          '$theme-dark': { boc: '$decay' },
        }}
        renderAfter={({ submit }) => (
          <YStack width="100%" gap="$6">
            {!has5Tags && (
              <XStack jc="space-between">
                <SubmitButton
                  onPress={() => submit()}
                  $gtSm={{ miw: 200 }}
                  br={12}
                  icon={<IconPlus />}
                >
                  <ButtonText fontFamily={'$mono'} col={'$color12'}>
                    ADD TAG
                  </ButtonText>
                </SubmitButton>
                {media.gtMd ? (
                  <SendTagPricingTooltip name={form.watch('name', '')} />
                ) : (
                  <SendTagPricingDialog name={form.watch('name', '')} />
                )}
              </XStack>
            )}
            {hasPendingTags ? (
              <YStack aria-labelledby="checkout-pending-tags-label">
                <Label fontFamily={'$mono'} fontSize={'$5'} $theme-dark={{ col: '$olive' }}>
                  {pendingTags?.length || 0} of {maxNumSendTags - (confirmedTags?.length || 0)}{' '}
                  SENDTAGS
                </Label>
                <Paragraph
                  fontFamily={'$mono'}
                  fontWeight={'400'}
                  $theme-light={{ col: '$gray11Light' }}
                  $theme-dark={{ col: '$gray11Dark' }}
                  py="$3"
                >
                  Your Sendtags are not confirmed until payment is received and your wallet is
                  verified
                </Paragraph>
                <XStack
                  btw={1}
                  bbw={1}
                  $theme-dark={{ boc: '$decay' }}
                  py="$2"
                  $gtMd={{ px: '$2' }}
                >
                  <Paragraph
                    $theme-dark={{ col: '$olive' }}
                    $gtMd={{ f: 2 }}
                    f={1}
                    maw="40%"
                    fontWeight={'bold'}
                    fontFamily={'$mono'}
                  >
                    Sendtag
                  </Paragraph>
                  <Paragraph
                    $theme-dark={{ col: '$olive' }}
                    f={1}
                    maw="30%"
                    ta="center"
                    fontWeight={'400'}
                    fontFamily={'$mono'}
                  >
                    Expires In
                  </Paragraph>
                  <Paragraph
                    $theme-dark={{ col: '$olive' }}
                    f={1}
                    maw="30%"
                    ta="center"
                    fontWeight={'400'}
                    fontFamily={'$mono'}
                  >
                    Price
                  </Paragraph>
                </XStack>
                {pendingTags
                  ?.sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )
                  .map((tag) => (
                    <XStack
                      $gtMd={{ px: '$2' }}
                      ai="center"
                      jc="space-between"
                      f={1}
                      key={tag.name}
                    >
                      <Paragraph
                        fontWeight={'bold'}
                        col="$color12"
                        f={2}
                        maw="40%"
                        fontFamily={'$mono'}
                        accessibilityLabel={`Pending Sendtag ${tag.name}`}
                        aria-label={`Pending Sendtag ${tag.name}`}
                      >
                        {tag.name}
                      </Paragraph>
                      <Paragraph col="$color12" ta="center" f={1} maw="30%" fontFamily={'$mono'}>
                        <HoldingTime created={new Date(tag.created_at)} />
                      </Paragraph>
                      <XStack
                        ai="center"
                        $gtMd={{ gap: '$3' }}
                        gap="$2"
                        f={1}
                        maw="30%"
                        jc="flex-end"
                      >
                        <Paragraph fontFamily={'$mono'} col="$color12">
                          <ConfirmTagPrice tag={tag} />
                        </Paragraph>
                        <Button
                          // @ts-expect-error tamagui doesn't support this yet
                          type="button"
                          bg="transparent"
                          maw="100%"
                          p="$0"
                          hoverStyle={{
                            bg: 'transparent',
                          }}
                          onPress={() => {
                            supabase
                              .from('tags')
                              .delete()
                              .eq('name', tag.name)
                              .then(({ data, error }) => {
                                if (error) {
                                  throw error
                                }
                                return data
                              })
                              .then(() => toast.show('Released'))
                              .then(() => user?.updateProfile())
                          }}
                        >
                          <X color="$red500" size={16} />
                        </Button>
                      </XStack>
                    </XStack>
                  ))}
              </YStack>
            ) : null}
          </YStack>
        )}
      >
        {(fields) => {
          return (
            <YStack mb="-$8" width="100%">
              {!has5Tags && (
                <Label $gtMd={{ py: '$4' }}>
                  {hasPendingTags ? 'ADD ANOTHER SENDTAG' : 'CREATE A NEW SENDTAG'}
                </Label>
              )}
              <XStack>{!has5Tags && Object.values(fields)}</XStack>
            </YStack>
          )
        }}
      </SchemaForm>
      {hasPendingTags && (
        <Theme name="accent">
          <AnimatePresence>
            <XStack w="100%">
              <Stack
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
                w="100%"
                flex={1}
                $gtMd={{ fd: 'row', jc: 'space-between' }}
                fd="column-reverse"
                jc={'center'}
                ai={'center'}
                gap="$4"
                py="$4"
              >
                <Stack
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
                  w="100%"
                  flex={1}
                  $gtMd={{ fd: 'row', jc: 'space-between' }}
                  fd="column-reverse"
                  jc={'center'}
                  ai={'center'}
                  gap="$4"
                  py="$4"
                >
                  <YStack maw={200} width="100%">
                    <OpenConnectModalWrapper>
                      <ConfirmButton
                        onConfirmed={onConfirmed}
                        needsVerification={needsVerification}
                      />
                    </OpenConnectModalWrapper>
                  </YStack>
                </Stack>
                <TotalPrice />
              </Stack>
            </XStack>
          </AnimatePresence>
        </Theme>
      )}
    </FormProvider>
  )
}

function HoldingTime({ created }: { created: Date }) {
  const expires = useMemo(() => {
    // expires 30 minutes after creation
    return new Date(created.getTime() + 1000 * 60 * 30)
  }, [created])
  const { minutes, seconds, diffInMs } = useTimeRemaining(expires)
  if (diffInMs <= 0) return 'Claimable'

  return `${minutes} m ${seconds} s`
}

function ConfirmTagPrice({ tag }: { tag: { name: string } }) {
  const confirmedTags = useConfirmedTags() ?? []
  const pendingTags = usePendingTags() ?? []
  const commonTags = pendingTags.filter((t) => t.name.length >= 6)

  // could be free if tag name is greater than 6 characters
  let hasFreeTag = tag.name.length >= 6

  // check if there are any confirmed tags that are 6 characters or longer
  hasFreeTag =
    hasFreeTag && (confirmedTags?.length === 0 || confirmedTags.every((tag) => tag.name.length < 6))

  // this tag is free if it's the first tag greater than 6 characters
  hasFreeTag = hasFreeTag && commonTags[0]?.name === tag.name

  const price = useMemo(() => tagLengthToWei(tag?.name.length, hasFreeTag), [tag, hasFreeTag])

  return price === BigInt(0) ? 'Free' : `${formatEther(price).toLocaleString()} ETH`
}

function TotalPrice() {
  const pendingTags = usePendingTags()
  const confirmedTags = useConfirmedTags()

  const weiAmount = useMemo(
    () => getPriceInWei(pendingTags ?? [], confirmedTags ?? []),
    [pendingTags, confirmedTags]
  )

  return (
    <YStack ai="center" $gtMd={{ ai: 'flex-end' }}>
      <Paragraph
        fontWeight={'500'}
        fontSize={'$5'}
        $theme-dark={{ col: '$gray9Light' }}
        $theme-light={{ col: '$gray9Dark' }}
      >
        Total
      </Paragraph>
      <Paragraph
        fontFamily={'$mono'}
        fontWeight={'400'}
        lineHeight={48}
        fontSize={'$9'}
        $theme-dark={{ col: '$white' }}
        $theme-light={{ col: '$black' }}
      >
        {formatEther(weiAmount).toLocaleString()} ETH
      </Paragraph>
    </YStack>
  )
}

function ConfirmButton({
  onConfirmed,
  needsVerification,
}: {
  onConfirmed: () => void
  needsVerification: boolean
}) {
  const media = useMedia()
  const { isLoadingTags, updateProfile, profile } = useUser()

  //Connect
  const pendingTags = usePendingTags()
  const confirmedTags = useConfirmedTags()
  const hasPendingTags = pendingTags && pendingTags?.length > 0
  const { chainId } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { switchChain } = useSwitchChain()
  const { error: connectError } = useConnect()

  //Verify
  const publicClient = usePublicClient()

  const { address: connectedAddress } = useAccount()
  const { data: ethBalance } = useBalance({
    address: connectedAddress,
    chainId: baseMainnet.id,
  })

  const weiAmount = useMemo(
    () => getPriceInWei(pendingTags ?? [], confirmedTags ?? []),
    [pendingTags, confirmedTags]
  )

  const isFree = weiAmount === BigInt(0)
  const canAffordTags = isFree || (ethBalance && ethBalance.value >= weiAmount)

  // Confirm
  const confirm = api.tag.confirm.useMutation()
  const { refetch: refetchReceipts } = useReceipts()
  const [sentTx, setSentTx] = useState<`0x${string}`>()

  const { data: txReceipt, error: txWaitError } = useWaitForTransactionReceipt({
    hash: sentTx,
    confirmations: 2,
  })

  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string>()
  const [confirmed, setConfirmed] = useState(false)

  const paidOrFree = (pendingTags ?? []).length > 0 && (isFree || txReceipt)
  const [attempts, setAttempts] = useState(0)

  const { sendTransactionAsync } = useSendTransaction({
    mutation: {
      onSuccess: setSentTx,
    },
  })

  const tx = {
    to: sendRevenueSafeAddress[chainId as keyof typeof sendRevenueSafeAddress],
    chainId: baseMainnet.id,
    value: weiAmount,
  } as const

  const {
    data: txData,
    error: estimateGasErr,
    isLoading: isLoadingTx,
  } = useEstimateGas({
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
      setError('Something went wrong')
    })
  }

  function submitTxToDb(tx?: string) {
    setAttempts((a) => a + 1)
    confirm
      .mutateAsync(tx ? {} : { transaction: tx })
      .then(async () => {
        setConfirmed(true)
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

  const { signMessageAsync } = useSignMessage({
    mutation: {
      onError: (err) => {
        setError('details' in err ? err?.details : err?.message)
      },
    },
  })

  const {
    data: addresses,
    isLoading: isLoadingAddresses,
    isRefetching: isRefetchingAddresses,
    refetch: updateAddresses,
  } = useChainAddresses()

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

  if (!connectedAddress) {
    return (
      <ConfirmButtonError buttonText={'Connect Wallet'} onPress={openConnectModal}>
        <YStack gap="$2" ai="center">
          <Paragraph $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
            Please connect your wallet to confirm your Send Tags.
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

  if (error) {
    return (
      <ConfirmButtonError
        buttonText={'Retry'}
        onPress={() =>
          txReceipt || isFree ? submitTxToDb(txReceipt?.transactionHash) : handleCheckoutTx()
        }
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
      space="$1.5"
      onPress={() => (isFree ? submitTxToDb() : handleCheckoutTx())}
      br={12}
      f={1}
    >
      {(() => {
        switch (true) {
          case !canAffordTags || estimateGasErr !== null:
            return <ButtonText>Insufficient funds</ButtonText>
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
