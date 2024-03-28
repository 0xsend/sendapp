import {
  AnimatePresence,
  Button,
  ButtonText,
  Label,
  Paragraph,
  SubmitButton,
  Theme,
  XStack,
  YStack,
  useToastController,
} from '@my/ui'

import { X } from '@tamagui/lucide-icons'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useConfirmedTags, usePendingTags } from 'app/utils/tags'
import { useChainAddresses } from 'app/utils/useChainAddresses'
import { useTimeRemaining } from 'app/utils/useTimeRemaining'
import { useUser } from 'app/utils/useUser'
import React, { useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { formatEther } from 'viem'
import { z } from 'zod'
import { ConfirmDialog } from './components/confirm-dialog'
import { CheckoutTagSchema } from './CheckoutTagSchema'
import { SendTagPricingDialog } from './SendTagPricingDialog'
import { maxNumSendTags, tagLengthToWei } from './checkout-utils'
import { IconPlus } from 'app/components/icons'

export const CheckoutForm = () => {
  const user = useUser()
  const pendingTags = usePendingTags()
  const confirmedTags = useConfirmedTags()
  const hasPendingTags = pendingTags && pendingTags.length > 0
  const form = useForm<z.infer<typeof CheckoutTagSchema>>()
  const supabase = useSupabase()
  const toast = useToastController()
  const hasConfirmedTags = confirmedTags && confirmedTags.length > 0
  const has5Tags = user?.tags?.length === 5
  const [needsVerification, setNeedsVerification] = React.useState(false)

  const { data: addresses } = useChainAddresses()

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
                <SendTagPricingDialog name={form.watch('name', '')} />
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
                  Your Send Tags are not confirmed until payment is received and your wallet is
                  verified
                </Paragraph>
                <XStack btw={1} bbw={1} $theme-dark={{ boc: '$decay' }} p="$2">
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
                    <>
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
                    </>
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
      <Theme name="accent">
        <AnimatePresence>
          <XStack w="100%">
            <ConfirmDialog onConfirmed={onConfirmed} needsVerification={needsVerification} />
          </XStack>
        </AnimatePresence>
      </Theme>
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
