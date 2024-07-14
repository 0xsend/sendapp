import {
  AnimatePresence,
  Avatar,
  Button,
  ButtonIcon,
  ButtonText,
  Fade,
  Input,
  Label,
  Paragraph,
  Stack,
  SubmitButton,
  Theme,
  XStack,
  YStack,
  useMedia,
  useToastController,
} from '@my/ui'
import { Check, X } from '@tamagui/lucide-icons'
import { IconAccount, IconPlus } from 'app/components/icons'
import { maxNumSendTags, price, total } from 'app/data/sendtags'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useConfirmedTags, usePendingTags } from 'app/utils/tags'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useTimeRemaining } from 'app/utils/useTimeRemaining'
import { useUser } from 'app/utils/useUser'
import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Link } from 'solito/link'
import { useRouter } from 'solito/router'
import { formatUnits } from 'viem'
import type { z } from 'zod'
import { CheckoutTagSchema } from './CheckoutTagSchema'
import { ConfirmButton } from './components/checkout-confirm-button'
import { SendTagPricingDialog, SendTagPricingTooltip } from './SendTagPricingDialog'

export const CheckoutForm = () => {
  const user = useUser()
  const pendingTags = usePendingTags()
  const confirmedTags = useConfirmedTags()
  const hasPendingTags = pendingTags && pendingTags.length > 0
  const form = useForm<z.infer<typeof CheckoutTagSchema>>()
  const supabase = useSupabase()
  const toast = useToastController()
  const has5Tags = user?.tags?.length === 5
  const media = useMedia()
  const router = useRouter()

  async function createSendTag({ name }: z.infer<typeof CheckoutTagSchema>) {
    if (!user.user) return console.error('No user')
    const { error } = await supabase.from('tags').insert({ name })

    if (error) {
      console.error("Couldn't create Sendtag", error)
      switch (error.code) {
        case '23505':
          form.setError('name', { type: 'custom', message: 'This Sendtag is already taken' })
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
    router.replace('/account/sendtag')
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

            fieldsetProps: {
              f: 1,
            },
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
                  <ButtonText fontFamily={'$mono'}>ADD TAG</ButtonText>
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
                    maw="35%"
                    fontWeight={'bold'}
                    fontFamily={'$mono'}
                  >
                    Sendtag
                  </Paragraph>
                  <Paragraph
                    $theme-dark={{ col: '$olive' }}
                    f={1}
                    maw="32%"
                    ta="center"
                    fontWeight={'400'}
                    fontFamily={'$mono'}
                  >
                    Expires In
                  </Paragraph>
                  <Paragraph
                    $theme-dark={{ col: '$olive' }}
                    f={1}
                    maw="33%"
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
                        maw="35%"
                        fontFamily={'$mono'}
                        aria-label={`Pending Sendtag ${tag.name}`}
                        testID={`Pending Sendtag ${tag.name}`}
                      >
                        {tag.name}
                      </Paragraph>
                      <Paragraph col="$color12" ta="center" f={1} maw="32%" fontFamily={'$mono'}>
                        <HoldingTime created={new Date(tag.created_at)} />
                      </Paragraph>
                      <XStack
                        ai="center"
                        $gtMd={{ gap: '$3' }}
                        gap="$2"
                        f={1}
                        maw="33%"
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
                            boc: '$backgroundTransparent',
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
                          <Theme name="red">
                            <ButtonIcon>
                              <X color={'$color8'} size={16} />
                            </ButtonIcon>
                          </Theme>
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
                <Label $gtMd={{ pb: '$4' }}>
                  {hasPendingTags ? 'ADD ANOTHER SENDTAG' : 'CREATE A NEW SENDTAG'}
                </Label>
              )}
              <XStack>{!has5Tags && Object.values(fields)}</XStack>
            </YStack>
          )
        }}
      </SchemaForm>

      <ReferredBy />

      {hasPendingTags && (
        <Theme name="green">
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
                  my="$4"
                >
                  <ConfirmButton onConfirmed={onConfirmed} />
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

/**
 * Shows the referral code and the user's profile if they have one
 */
function ReferredBy() {
  const referralFromCookie = () => {
    if (typeof document === 'undefined') return ''
    const referral = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('referral='))
    return referral?.split('=')[1] ?? ''
  }
  const [refcode, setRefcode] = useState<string>(referralFromCookie())
  const { data: profile, error } = useProfileLookup('refcode', refcode)

  // set the referral cookie
  useEffect(() => {
    document.cookie = `referral=${refcode}; Max-Age=${30 * 24 * 60 * 60 * 1000}; Path=/;` // 30 days
  }, [refcode])

  return (
    <YStack w="100%" mt="$4" gap="$2" borderBottomWidth={1} pb="$6" borderColor="$decay">
      <Paragraph
        fontFamily={'$mono'}
        fontWeight={'400'}
        $theme-light={{ col: '$gray11Light' }}
        $theme-dark={{ col: '$gray11Dark' }}
        fontSize={'$4'}
        mb="$0"
        pb="$0"
      >
        Referred by someone? Enter their referral code below.
      </Paragraph>
      <XStack gap="$2" ai={'center'} jc="flex-start">
        <YStack jc="flex-start" ai="flex-start">
          <Label fontWeight="500" col={'$color12'} htmlFor={'refcode'}>
            Referral Code:
          </Label>
          <XStack gap="$2" jc="flex-start" ai="flex-start">
            <Input
              id={'refcode'}
              defaultValue={referralFromCookie()}
              onChangeText={(text) => setRefcode(text)}
              col={'$color12'}
            />
            {profile && (
              <Fade>
                <Check color="$green10Dark" size="1" position="absolute" right="$3" top="$3" />
              </Fade>
            )}
          </XStack>
        </YStack>
        {profile && (
          <Fade jc="flex-end" ai="flex-start" h="100%">
            <YStack gap="$2" jc="flex-end">
              <Link href={`/profile/${profile.sendid}`}>
                <Avatar size="$2" br="$3" mx="auto">
                  <Avatar.Image src={profile.avatar_url ?? ''} />
                  <Avatar.Fallback jc="center">
                    <IconAccount size="$2" color="$olive" />
                  </Avatar.Fallback>
                </Avatar>
                <Paragraph fontSize="$2" fontWeight="500" color="$color12">
                  {(() => {
                    switch (true) {
                      case !!profile.tag:
                        return `/${profile.tag}`
                      case !!profile.name:
                        return profile.name
                      default:
                        return `#${profile.sendid}`
                    }
                  })()}
                </Paragraph>
              </Link>
            </YStack>
          </Fade>
        )}
        {error && (
          <Paragraph
            fontFamily={'$mono'}
            fontWeight={'400'}
            $theme-light={{ col: '$gray11Light' }}
            $theme-dark={{ col: '$gray11Dark' }}
            fontSize={'$4'}
            mb="$0"
            pb="$0"
            width={'100%'}
          >
            {error}
          </Paragraph>
        )}
      </XStack>
    </YStack>
  )
}

function HoldingTime({ created }: { created: Date }) {
  const expires = useMemo(() => {
    // expires 30 minutes after creation
    return new Date(created.getTime() + 1000 * 60 * 30)
  }, [created])
  const { minutes, seconds, diffInMs } = useTimeRemaining(expires)
  if (diffInMs <= 0) return 'Claimable'

  return `${minutes}m ${seconds}s`
}

function ConfirmTagPrice({ tag }: { tag: { name: string } }) {
  const _price = useMemo(() => price(tag.name.length), [tag])
  return `${formatUnits(_price, 6)} USDC`
}

function TotalPrice() {
  const pendingTags = usePendingTags()

  const _total = useMemo(() => total(pendingTags ?? []), [pendingTags])

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
        {formatUnits(_total, 6)} USDC
      </Paragraph>
    </YStack>
  )
}
