import {
  Adapt,
  AnimatePresence,
  Button,
  Dialog,
  FormWrapper,
  H2,
  KVTable,
  Paragraph,
  ScrollView,
  Section,
  Separator,
  Sheet,
  SizableText,
  SubmitButton,
  Theme,
  Tooltip,
  Unspaced,
  XStack,
  YStack,
  useIsTouchDevice,
  useToastController,
} from '@my/ui'
import { AlertTriangle, Clock, Info, X, XCircle } from '@tamagui/lucide-icons'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useConfirmedTags, usePendingTags } from 'app/utils/tags'
import { useTimeRemaining } from 'app/utils/useTimeRemaining'
import { useUser } from 'app/utils/useUser'
import React, { useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { PublicClient, formatEther, parseEther } from 'viem'
import { z } from 'zod'
import { ConfirmDialog } from './components/confirm-dialog'
import { useChainAddresses } from 'app/utils/useChainAddresses'
import { sendRevenueSafeAddress } from '@my/wagmi'

const CheckoutSchema = z.object({
  name: formFields.text
    .min(1)
    .max(20)
    // English alphabet, numbers, and underscore
    .regex(/^[a-zA-Z0-9_]+$/, 'Only English alphabet, numbers, and underscore')
    .describe('Name // Your Send Tag name'),
})

export const verifyAddressMsg = (a: string | `0x${string}`) =>
  `I am the owner of the address: ${a}.`

/**
| Send Tag Length | Cost to Confirm |
|-----------------|-----------------|
| 6+              | first 0.005 ETH, 0.01 ETH after |
| 5               | 0.01 ETH         |
| 4               | 0.03 ETH         |
| 1-3             | 0.05 ETH         |
 */
export function tagLengthToWei(length: number, isFirstTag = false) {
  switch (length) {
    case 5:
      return parseEther('0.01')
    case 4:
      return parseEther('0.03')
    case 3:
    case 2:
    case 1:
      return parseEther('0.05')
    default:
      if (isFirstTag) {
        return parseEther('0.005')
      } else {
        return parseEther('0.01')
      }
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
  publicClient: PublicClient
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
    fromBlock: BigInt(17993814), // send revenue contract creation block,
  })
}

export const CheckoutScreen = () => {
  const isTouch = useIsTouchDevice()
  const form = useForm<z.infer<typeof CheckoutSchema>>()
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

  async function createSendTag({ name }: z.infer<typeof CheckoutSchema>) {
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
              <H2 ta="center">Send Tags Confirmed</H2>
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
    <YStack h="100%" width="100%">
      <YStack f={1} als={'stretch'} h="100%" width="100%">
        <FormProvider {...form}>
          <SchemaForm
            form={form}
            onSubmit={createSendTag}
            schema={CheckoutSchema}
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
            renderAfter={({ submit }) => (
              <YStack width="100%" mb="$16" mt="-$20" position="relative" top="-$20">
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
                      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
                  <YStack gap="$2" py="$4" pb="$4" mx="auto" width="100%" $gtMd={{ maxWidth: 600 }}>
                    <XStack jc="space-between">
                      <H2 ta="center">Send Tags</H2>
                      <SendTagPricingDialog />
                    </XStack>
                    <YStack aria-labelledby="send-tags-registered" gap="$2">
                      <XStack justifyContent="space-between" ai="center">
                        <YStack>
                          {hasConfirmedTags && (
                            <Paragraph id="send-tags-registered">Send Tags Registered</Paragraph>
                          )}
                        </YStack>
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
                          Your Send Tags are not confirmed until payment is received and your wallet
                          is verified.
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
          <Theme name="yellow">
            <AnimatePresence>
              <ConfirmDialog onConfirmed={onConfirmed} needsVerification={needsVerification} />
            </AnimatePresence>
          </Theme>
        </FormProvider>
      </YStack>
    </YStack>
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
            <XStack ai="center" jc="space-between" space="$1.5" theme="orange">
              <AlertTriangle color="$orange11" />
              <Paragraph>Claimable</Paragraph>
            </XStack>
          </Tooltip.Trigger>
        )}
        {diffInMs > 0 && (
          <Tooltip.Trigger>
            <XStack ai="center" jc="space-between" space="$1.5" theme="orange">
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
          <Paragraph size="$2" lineHeight="$1" maw="$20">
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

function SendTagPricingDialog() {
  return (
    <Dialog modal>
      <Dialog.Trigger asChild>
        <Button
          position="absolute"
          top="$1"
          right={0}
          maw="$20"
          mx="auto"
          chromeless
          icon={<Info />}
          // @ts-expect-error tamagui doesn't support this yet
          type="button"
        >
          Pricing
        </Button>
      </Dialog.Trigger>

      <Adapt when="sm" platform="touch">
        <Sheet zIndex={200000} modal dismissOnSnapToBottom disableDrag>
          <Sheet.Frame padding="$4" gap="$4">
            <Adapt.Contents />
          </Sheet.Frame>
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
          width="100%"
          maw={600}
        >
          <Dialog.Title>Send Tag Pricing</Dialog.Title>
          <Dialog.Description>
            Send Tags are priced based on their length. The shorter the Send Tag, the more it costs.
          </Dialog.Description>
          <ScrollView>
            <Section>
              <KVTable>
                <KVTable.Row>
                  <KVTable.Key>
                    <SizableText fontWeight="900">6+ characters</SizableText>
                  </KVTable.Key>
                  <KVTable.Value>
                    <SizableText>
                      First one {(0.005).toLocaleString()} ETH, {(0.01).toLocaleString()} ETH after
                    </SizableText>
                  </KVTable.Value>
                </KVTable.Row>
                <KVTable.Row>
                  <KVTable.Key>
                    <SizableText fontWeight="900">5 characters</SizableText>
                  </KVTable.Key>
                  <KVTable.Value>
                    <SizableText>{(0.01).toLocaleString()} ETH</SizableText>
                  </KVTable.Value>
                </KVTable.Row>
                <KVTable.Row>
                  <KVTable.Key>
                    <SizableText fontWeight="900">4 characters</SizableText>
                  </KVTable.Key>
                  <KVTable.Value>
                    <SizableText>{(0.03).toLocaleString()} ETH</SizableText>
                  </KVTable.Value>
                </KVTable.Row>
                <KVTable.Row>
                  <KVTable.Key>
                    <SizableText fontWeight="900">1-3 characters</SizableText>
                  </KVTable.Key>
                  <KVTable.Value>
                    <SizableText>{(0.05).toLocaleString()} ETH</SizableText>
                  </KVTable.Value>
                </KVTable.Row>
              </KVTable>
            </Section>
          </ScrollView>

          <XStack alignSelf="flex-end" gap="$4">
            <Dialog.Close displayWhenAdapted asChild>
              <Button theme="alt1" aria-label="Close">
                Ok
              </Button>
            </Dialog.Close>
          </XStack>

          <Unspaced>
            <Dialog.Close asChild>
              <Button position="absolute" top="$3" right="$3" size="$2" circular icon={X} />
            </Dialog.Close>
          </Unspaced>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
