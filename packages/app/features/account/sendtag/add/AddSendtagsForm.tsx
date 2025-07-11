import {
  Button,
  FadeCard,
  Paragraph,
  PrimaryButton,
  Separator,
  SubmitButton,
  useMedia,
  useThemeName,
  XStack,
  YStack,
} from '@my/ui'
import { IconPlus, IconX } from 'app/components/icons'
import { maxNumSendTags, price, total } from 'app/data/sendtags'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useConfirmedTags, usePendingTags } from 'app/utils/tags'
import { useUser } from 'app/utils/useUser'
import { useCallback, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { formatUnits } from 'viem'
import type { z } from 'zod'
import { SendtagSchema } from 'app/utils/zod/sendtag'
import { SendTagPricingDialog, SendTagPricingTooltip } from '../checkout/SendTagPricingDialog'
import { RowLabel } from 'app/components/layout/RowLabel'
import { usdcCoin } from 'app/data/coins'
import { useReleaseTag } from 'app/features/account/sendtag/checkout/checkout-utils'
import { api } from 'app/utils/api'
import { useLink } from 'solito/link'

export const AddSendtagsForm = () => {
  const user = useUser()
  const pendingTags = usePendingTags()
  const confirmedTags = useConfirmedTags()
  const hasPendingTags = pendingTags && pendingTags.length > 0
  const form = useForm<z.infer<typeof SendtagSchema>>()
  const has5Tags = user?.tags?.length === 5
  const media = useMedia()
  const theme = useThemeName()
  const isDarkTheme = theme?.startsWith('dark')
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const { mutateAsync: releaseTagMutateAsync } = useReleaseTag()
  const linkProps = useLink({
    href: '/account/sendtag/checkout',
  })

  const createTagMutation = api.tag.create.useMutation()

  async function createSendTag({ name }: z.infer<typeof SendtagSchema>) {
    if (!user.user) return console.error('No user')

    try {
      await createTagMutation.mutateAsync({ name })
      // form state is successfully submitted, show the purchase confirmation screen
      form.reset()
      user?.updateProfile()
    } catch (error) {
      console.error("Couldn't create Sendtag", error)
      if (error?.message?.includes('already taken')) {
        form.setError('name', { type: 'custom', message: 'This Sendtag is already taken' })
      } else {
        form.setError('name', {
          type: 'custom',
          message: error?.message ?? 'Something went wrong',
        })
      }
    }
  }

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <XStack jc="space-between" ai={'center'}>
        {media.gtMd ? (
          <SendTagPricingTooltip name={form.watch('name', '')} />
        ) : (
          <SendTagPricingDialog name={form.watch('name', '')} />
        )}
        <SubmitButton
          onPress={submit}
          borderRadius={'$4'}
          variant="outlined"
          px={'$3'}
          py={'$1.5'}
          width={'auto'}
          borderColor={isDarkTheme ? '$primary' : '$color12'}
          height={40}
          borderWidth={1}
          spinnerProps={{ theme: '$dark' }}
          icon={<IconPlus size={'$1'} color={'$primary'} $theme-light={{ color: '$color12' }} />}
        >
          <SubmitButton.Text color={'$white'} $theme-light={{ color: '$color12' }}>
            ADD TAG
          </SubmitButton.Text>
        </SubmitButton>
      </XStack>
    ),
    [media, form, isDarkTheme]
  )

  return (
    <>
      <YStack gap={'$5'}>
        <FormProvider {...form}>
          {!has5Tags && (
            <YStack gap={'$3.5'}>
              <RowLabel>{hasPendingTags ? 'Add Another Sendtag' : 'Create a New Sendtag'}</RowLabel>
              <FadeCard>
                <SchemaForm
                  form={form}
                  onSubmit={createSendTag}
                  schema={SendtagSchema}
                  defaultValues={{
                    name: '',
                  }}
                  props={{
                    name: {
                      autoFocus: true,
                      'aria-label': 'Sendtag name',
                      placeholder: 'Enter Sendtag name',
                      color: '$color12',
                      fontWeight: '500',
                      bw: 0,
                      br: 0,
                      p: 1,
                      focusStyle: {
                        outlineWidth: 0,
                      },
                      '$theme-dark': {
                        placeholderTextColor: '$darkGrayTextField',
                      },
                      '$theme-light': {
                        placeholderTextColor: '$darkGrayTextField',
                      },
                      fontSize: '$8',
                      onFocus: () => setIsInputFocused(true),
                      onBlur: () => setIsInputFocused(false),
                    },
                  }}
                  formProps={{
                    f: 0,
                    footerProps: { p: 0 },
                  }}
                  renderAfter={renderAfterContent}
                >
                  {({ name }) => {
                    return (
                      <XStack position="relative">
                        {name}
                        <XStack
                          position="absolute"
                          bottom={-8}
                          left={0}
                          right={0}
                          height={1}
                          backgroundColor={isInputFocused ? '$primary' : '$silverChalice'}
                          $theme-light={{
                            backgroundColor: isInputFocused ? '$color12' : '$silverChalice',
                          }}
                        />
                      </XStack>
                    )
                  }}
                </SchemaForm>
              </FadeCard>
            </YStack>
          )}
          {hasPendingTags && (
            <YStack gap={'$3.5'}>
              <RowLabel>
                Sendtags [ {pendingTags?.length || 0}/
                {maxNumSendTags - (confirmedTags?.length || 0)} ]
              </RowLabel>
              <FadeCard>
                <XStack jc={'space-between'}>
                  <Paragraph size={'$6'}>Name</Paragraph>
                  <Paragraph size={'$6'}>Price</Paragraph>
                </XStack>
                <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
                <YStack aria-labelledby="checkout-pending-tags-label" gap={'$2'}>
                  {pendingTags
                    ?.sort(
                      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                    .map((tag) => (
                      <XStack ai="center" jc="space-between" key={tag.name}>
                        <XStack
                          f={0}
                          px={'$3.5'}
                          py={'$2'}
                          gap={'$3'}
                          ai={'center'}
                          jc={'space-between'}
                          backgroundColor={
                            isDarkTheme ? 'rgba(255,255,255, 0.1)' : 'rgba(0,0,0, 0.1)'
                          }
                          borderRadius={'$3'}
                          width={'fit-content'}
                          maxWidth={'80%'}
                          testID={`pending-tag-${tag.name}`}
                        >
                          <Paragraph size={'$5'} maxWidth={'90%'}>
                            {tag.name}
                          </Paragraph>
                          <Button
                            chromeless
                            backgroundColor="transparent"
                            hoverStyle={{ backgroundColor: 'transparent' }}
                            pressStyle={{
                              backgroundColor: 'transparent',
                              borderColor: 'transparent',
                            }}
                            focusStyle={{ backgroundColor: 'transparent' }}
                            padding={0}
                            height={'auto'}
                            onPress={() => releaseTagMutateAsync(tag.name)}
                          >
                            <Button.Icon>
                              <IconX size={'$0.9'} color="$error" />
                            </Button.Icon>
                          </Button>
                        </XStack>
                        <Paragraph
                          size={'$5'}
                          color={'$lightGrayTextField'}
                          $theme-light={{ color: '$darkGrayTextField' }}
                        >
                          <ConfirmTagPrice tag={tag} />
                        </Paragraph>
                      </XStack>
                    ))}
                </YStack>
                <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
                <TotalPrice />
              </FadeCard>
            </YStack>
          )}
        </FormProvider>
      </YStack>
      <YStack gap={'$3.5'}>
        <Paragraph
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
          ta={'center'}
        >
          Your Sendtag will be secured after payment confirmation
        </Paragraph>
        <PrimaryButton disabled={!hasPendingTags} {...linkProps}>
          <PrimaryButton.Text>continue</PrimaryButton.Text>
        </PrimaryButton>
      </YStack>
    </>
  )
}

function ConfirmTagPrice({ tag }: { tag: { name: string } }) {
  const _price = useMemo(() => price(tag.name.length), [tag])
  return `${formatUnits(_price, usdcCoin.decimals)} USDC`
}

function TotalPrice() {
  const pendingTags = usePendingTags()
  const _total = useMemo(() => total(pendingTags ?? []), [pendingTags])

  return (
    <XStack jc={'space-between'} ai="center">
      <Paragraph
        fontSize={'$5'}
        color={'$lightGrayTextField'}
        $theme-light={{ color: '$darkGrayTextField' }}
      >
        Total
      </Paragraph>
      <Paragraph fontWeight={'500'} fontSize={'$8'} lineHeight={'$8'}>
        {formatUnits(_total, usdcCoin.decimals)} USDC
      </Paragraph>
    </XStack>
  )
}
