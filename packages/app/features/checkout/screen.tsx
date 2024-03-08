import {
  AnimatePresence,
  Button,
  Container,
  FormWrapper,
  Paragraph,
  Separator,
  SubmitButton,
  Theme,
  Tooltip,
  XStack,
  YStack,
  useIsTouchDevice,
  useToastController,
} from '@my/ui'
import { baseMainnetClient, sendRevenueSafeAddress } from '@my/wagmi'
import { AlertTriangle, Clock, XCircle } from '@tamagui/lucide-icons'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useConfirmedTags, usePendingTags } from 'app/utils/tags'
import { useChainAddresses } from 'app/utils/useChainAddresses'
import { useTimeRemaining } from 'app/utils/useTimeRemaining'
import { useUser } from 'app/utils/useUser'
import React, { useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { formatEther, parseEther } from 'viem'
import { z } from 'zod'
import { ConfirmDialog } from './components/confirm-dialog'
import { CheckoutTagSchema } from './CheckoutTagSchema'
import { SendTagPricingDialog } from './SendTagPricingDialog'

export const verifyAddressMsg = (a: string | `0x${string}`) =>
  `I am the owner of the address: ${a}.
  
Send.app`

/**
| Send Tag Length | Cost to Confirm |
| --------------- | --------------- |
| 5+              | 0.01 ETH        |
| 4               | 0.02 ETH        |
| 1-3             | 0.03 ETH        |
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function tagLengthToWei(length: number, isFirstTag = false) {
  switch (length) {
    case 4:
      return parseEther('0.02')
    case 3:
    case 2:
    case 1:
      return parseEther('0.03')
    default:
      return parseEther('0.01')
  }
}

export function getPriceInWei(tags: { name: string }[], confirmed: { name: string }[]) {
  let hasFreeTag = confirmed.length === 0 || confirmed.every((tag) => tag.name.length < 6)

  return tags.reduce((acc, tag) => {
    const total = acc + tagLengthToWei(tag.name.length, hasFreeTag)
    if (tag.name.length >= 6) {
      hasFreeTag = false
    }
    return total
  }, BigInt(0))
}

export async function getSenderSafeReceivedEvents({
  publicClient,
  sender,
}: {
  publicClient: typeof baseMainnetClient
  sender: `0x${string}`
}) {
  return await publicClient.getLogs({
    event: {
      type: 'event',
      inputs: [
        { name: 'sender', internalType: 'address', type: 'address', indexed: true },
        { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
      ],
      name: 'SafeReceived',
    },
    address: sendRevenueSafeAddress,
    args: {
      sender,
    },
    strict: true,
    fromBlock: BigInt(11269822), // send revenue contract creation block,
  })
}

export const CheckoutScreen = () => {
  const isTouch = useIsTouchDevice()
  const form = useForm<z.infer<typeof CheckoutTagSchema>>()
  const supabase = useSupabase()
  const toast = useToastController()
  const user = useUser()
  const pendingTags = usePendingTags()
  const confirmedTags = useConfirmedTags()
  const hasPendingTags = pendingTags && pendingTags.length > 0
  const hasConfirmedTags = confirmedTags && confirmedTags.length > 0
  const has5Tags = user?.tags?.length === 5
  const { data: addresses } = useChainAddresses()
  const [needsVerification, setNeedsVerification] = React.useState(false)

  async function createSendTag({ name }: z.infer<typeof CheckoutTagSchema>) {
    setNeedsVerification(false) // reset verification state

    if (!user.user) return console.error('No user')
    const { error } = await supabase.from('tags').insert({ name })

    if (error) {
      console.error("Couldn't create Send Tag", error)
      switch (error.code) {
        case '23505':
          form.setError('name', { type: 'custom', message: 'This Send Tag is already taken' })
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

  // manage the scroll state when new tags are added but ensure the name input is always visible
  useEffect(() => {
    if (hasPendingTags) {
      window?.scrollTo({
        top: document?.body?.scrollHeight - 140,
        behavior: 'smooth',
      })
    }
  }, [hasPendingTags])

  if (confirmedTags?.length === 5) {
    return (
      <YStack h="100%" width="100%">
        <YStack f={1} als={'stretch'} h="100%" width="100%">
          <YStack gap="$2" py="$4" pb="$4" mx="auto" width="100%" maw={600}>
            <FormWrapper.Body>
              <Paragraph>You have already reserved 5 Send Tags.</Paragraph>
              {user.tags?.map((tag) => (
                <YStack key={tag.name} space="$2">
                  <Paragraph fontWeight={'bold'}>{tag.name}</Paragraph>
                </YStack>
              ))}
            </FormWrapper.Body>
          </YStack>
        </YStack>
      </YStack>
    )
  }

  return (
    <Container>
      <YStack h="100%" width="100%">
        <YStack f={1} als={'stretch'} h="100%" $lg={{ mx: 'auto' }}>
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
                  'aria-label': 'Send Tag name',
                  placeholder: 'Send Tag name',
                },
              }}
              formProps={{
                width: '100%',
                maxWidth: '100%',
                $gtMd: {
                  als: 'flex-start',
                },
              }}
              renderAfter={({ submit }) => (
                <YStack width="100%">
                  {!has5Tags && (
                    <Theme inverse>
                      <SubmitButton mb="$6" onPress={() => submit()}>
                        Add Tag
                      </SubmitButton>
                    </Theme>
                  )}
                  <YStack aria-labelledby="checkout-pending-tags-label">
                    {has5Tags && (
                      <Paragraph id="checkout-pending-tags-label" ta="center" mb="$6">
                        Please review your Send Tags below.
                      </Paragraph>
                    )}
                    {pendingTags
                      ?.sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                      )
                      .map((tag) => (
                        <YStack
                          aria-label={`Pending Send Tag ${tag.name}`}
                          position="relative"
                          top="-$8"
                          mt="-$6"
                          space="$2"
                          key={tag.name}
                        >
                          <XStack jc="space-between" ai="center" f={1}>
                            <Paragraph fontWeight={'bold'}>{tag.name}</Paragraph>
                            <Paragraph>
                              <Button
                                // @ts-expect-error tamagui doesn't support this yet
                                type="button"
                                bg="transparent"
                                maw="100%"
                                p="$0"
                                hoverStyle={{ bg: 'transparent' }}
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
                                <XCircle color="$color11" />
                              </Button>
                            </Paragraph>
                          </XStack>

                          <XStack jc="space-between" ai="center" f={1}>
                            <ConfirmTagPrice tag={tag} />
                            <HoldingTime created={new Date(tag.created_at)} />
                          </XStack>
                        </YStack>
                      ))}
                  </YStack>
                </YStack>
              )}
            >
              {(fields) => {
                return (
                  <YStack mb="-$8" width="100%">
                    <YStack gap="$2" py="$4" pb="$4" mx="auto" width="100%">
                      <YStack aria-labelledby="send-tags-registered" gap="$2">
                        <XStack justifyContent="space-between" ai="center">
                          <YStack>
                            {hasConfirmedTags && (
                              <Paragraph id="send-tags-registered">Send Tags Registered</Paragraph>
                            )}
                          </YStack>
                          <SendTagPricingDialog />
                        </XStack>
                        {confirmedTags?.map((tag) => (
                          <YStack
                            aria-label={`Confirmed Send Tag ${tag.name}`}
                            key={tag.name}
                            space="$2"
                          >
                            <Paragraph fontWeight={'bold'}>{tag.name}</Paragraph>
                          </YStack>
                        ))}
                        {hasConfirmedTags && <Separator my="$2" />}
                      </YStack>
                      <Paragraph>
                        Pick a unique a Send Tag that is not yet reserved. Reserve up to 5 tags.
                      </Paragraph>

                      <YStack space="$2" mb="$4">
                        {!hasPendingTags && !hasConfirmedTags && (
                          <Paragraph>You have no Send Tags yet</Paragraph>
                        )}
                        {hasPendingTags && (
                          <Paragraph>
                            Your Send Tags are not confirmed until payment is received and your
                            wallet is verified.
                          </Paragraph>
                        )}
                        {isTouch && (
                          <Paragraph>
                            Each Send Tag is reserved for 30 minutes. If you do not claim it within
                            that time, it is claimable by someone else.
                          </Paragraph>
                        )}
                      </YStack>
                    </YStack>
                    <YStack>
                      <Paragraph position="absolute" als="flex-end" mb="$0" p="$0">
                        Registered {user?.tags?.length ?? 0} / 5
                      </Paragraph>
                      {!has5Tags && Object.values(fields)}
                    </YStack>
                  </YStack>
                )
              }}
            </SchemaForm>
            <Theme name="accent">
              <AnimatePresence>
                <ConfirmDialog onConfirmed={onConfirmed} needsVerification={needsVerification} />
              </AnimatePresence>
            </Theme>
          </FormProvider>
        </YStack>
      </YStack>
    </Container>
  )
}

function HoldingTime({ created }: { created: Date }) {
  const expires = useMemo(() => {
    // expires 30 minutes after creation
    return new Date(created.getTime() + 1000 * 60 * 30)
  }, [created])
  const { minutes, seconds, diffInMs } = useTimeRemaining(expires)

  return (
    <XStack ai="center" jc="center" space="$1">
      <Tooltip>
        {diffInMs <= 0 && (
          <Tooltip.Trigger>
            <XStack ai="center" jc="space-between" space="$1.5" theme="red">
              <AlertTriangle color="$orange11" />
              <Paragraph>Claimable</Paragraph>
            </XStack>
          </Tooltip.Trigger>
        )}
        {diffInMs > 0 && (
          <Tooltip.Trigger>
            <XStack ai="center" jc="space-between" space="$1.5" theme="red">
              <Clock />
              <Paragraph>
                {minutes}m {seconds}s
              </Paragraph>
            </XStack>
          </Tooltip.Trigger>
        )}

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
        >
          <Tooltip.Arrow />
          <Paragraph size="$2" maw="$20">
            Each Send Tag is reserved for 30 minutes. If you do not claim it within that time, it is
            claimable by someone else.
          </Paragraph>
        </Tooltip.Content>
      </Tooltip>
    </XStack>
  )
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

  return price === BigInt(0) ? (
    <Paragraph>Free</Paragraph>
  ) : (
    <Paragraph>Price: {formatEther(price).toLocaleString()} ETH</Paragraph>
  )
}
