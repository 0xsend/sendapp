import {
  Button,
  ButtonText,
  LinkableButton,
  Paragraph,
  Separator,
  SubmitButton,
  useMedia,
  useToastController,
  XStack,
  YStack,
} from '@my/ui'
import { IconPlus, IconX } from 'app/components/icons'
import { maxNumSendTags, price, total } from 'app/data/sendtags'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useConfirmedTags, usePendingTags } from 'app/utils/tags'
import { useUser } from 'app/utils/useUser'
import { useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { formatUnits } from 'viem'
import type { z } from 'zod'
import { CheckoutTagSchema } from '../checkout/CheckoutTagSchema'
import { SendTagPricingDialog, SendTagPricingTooltip } from '../checkout/SendTagPricingDialog'
import { RowLabel } from 'app/components/layout/RowLabel'
import { Section } from 'app/components/layout/Section'
import { useThemeSetting } from '@tamagui/next-theme'

export const AddSendtagsForm = () => {
  const user = useUser()
  const pendingTags = usePendingTags()
  const confirmedTags = useConfirmedTags()
  const hasPendingTags = pendingTags && pendingTags.length > 0
  const form = useForm<z.infer<typeof CheckoutTagSchema>>()
  const supabase = useSupabase()
  const toast = useToastController()
  const has5Tags = user?.tags?.length === 5
  const media = useMedia()
  const { resolvedTheme } = useThemeSetting()
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)

  const isDarkTheme = resolvedTheme?.startsWith('dark')

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

  return (
    <>
      <YStack gap={'$5'}>
        <FormProvider {...form}>
          {!has5Tags && (
            <YStack gap={'$3.5'}>
              <RowLabel>{hasPendingTags ? 'Add Another Sendtag' : 'Create a New Sendtag'}</RowLabel>
              <Section>
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
                    footerProps: { pb: 0 },
                  }}
                  renderAfter={({ submit }) => (
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
                        height={'fit-content'}
                        px={'$3'}
                        py={'$1.5'}
                        hoverStyle={{ borderColor: isDarkTheme ? '$primary' : '$color12' }}
                        $theme-light={{
                          borderColor: '$color12',
                        }}
                        icon={
                          <IconPlus
                            size={'$1'}
                            color={'$primary'}
                            $theme-light={{ color: '$color12' }}
                          />
                        }
                      >
                        <ButtonText
                          fontFamily={'$mono'}
                          color={'$white'}
                          $theme-light={{ color: '$color12' }}
                        >
                          ADD TAG
                        </ButtonText>
                      </SubmitButton>
                    </XStack>
                  )}
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
              </Section>
            </YStack>
          )}
          {hasPendingTags && (
            <>
              <YStack gap={'$3.5'}>
                <RowLabel>
                  Sendtags [ {pendingTags?.length || 0}/
                  {maxNumSendTags - (confirmedTags?.length || 0)} ]
                </RowLabel>
                <Section>
                  <XStack jc={'space-between'}>
                    <Paragraph size={'$6'}>Name</Paragraph>
                    <Paragraph size={'$6'}>Price</Paragraph>
                  </XStack>
                  <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
                  <YStack aria-labelledby="checkout-pending-tags-label" gap={'$2'}>
                    {pendingTags
                      ?.sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                      )
                      .map((tag) => (
                        <XStack ai="center" jc="space-between" key={tag.name}>
                          <XStack
                            px={'$3.5'}
                            py={'$2'}
                            gap={'$3'}
                            ai={'center'}
                            jc={'space-between'}
                            backgroundColor={
                              isDarkTheme ? 'rgba(255,255,255, 0.1)' : 'rgba(0,0,0, 0.1)'
                            }
                            borderRadius={'$3'}
                            maxWidth={'80%'}
                          >
                            <Paragraph size={'$5'} width={'90%'}>
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
                </Section>
              </YStack>
            </>
          )}
        </FormProvider>
      </YStack>
      <YStack gap={'$3.5'}>
        <LinkableButton
          theme="green"
          borderRadius={'$4'}
          p={'$4'}
          href={'/account/sendtag/checkout'}
          disabled={!hasPendingTags}
        >
          <LinkableButton.Text
            ff={'$mono'}
            fontWeight={'500'}
            tt="uppercase"
            size={'$5'}
            color={'$black'}
          >
            confirm
          </LinkableButton.Text>
        </LinkableButton>
        <Paragraph
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
          ta={'center'}
        >
          Your Sendtag will be secured after payment confirmation
        </Paragraph>
      </YStack>
    </>
  )
}

function ConfirmTagPrice({ tag }: { tag: { name: string } }) {
  const _price = useMemo(() => price(tag.name.length), [tag])
  return `${formatUnits(_price, 6)} USDC`
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
      <Paragraph fontWeight={'500'} fontSize={'$8'}>
        {formatUnits(_total, 6)} USDC
      </Paragraph>
    </XStack>
  )
}
