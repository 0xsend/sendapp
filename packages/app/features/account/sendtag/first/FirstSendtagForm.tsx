import { Button, FadeCard, Paragraph, SubmitButton, XStack, YStack } from '@my/ui'
import { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { api } from 'app/utils/api'
import { useRouter } from 'solito/router'
import { useUser } from 'app/utils/useUser'
import { useValidateSendtag } from 'app/utils/tags/useValidateSendtag'
import { ReferredBy } from 'app/features/account/sendtag/components/ReferredBy'
import { Platform } from 'react-native'

const SendtagSchemaWithoutRestrictions = z.object({
  name: formFields.text,
})

export const FirstSendtagForm = () => {
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const form = useForm<z.infer<typeof SendtagSchemaWithoutRestrictions>>()
  const router = useRouter()
  const user = useUser()

  const formName = form.watch('name')
  const validationError = form.formState.errors.root
  const canSubmit = !!formName && !validationError

  const { mutateAsync: validateSendtagMutateAsync } = useValidateSendtag()
  const { mutateAsync: registerFirstSendtagMutateAsync } =
    api.tag.registerFirstSendtag.useMutation()

  useEffect(() => {
    const subscription = form.watch(() => {
      form.clearErrors('root')
    })

    return () => subscription.unsubscribe()
  }, [form.watch, form.clearErrors])

  const handleSubmit = async ({ name }: z.infer<typeof SendtagSchemaWithoutRestrictions>) => {
    try {
      await validateSendtagMutateAsync({ name })
      await registerFirstSendtagMutateAsync({ name })
    } catch (error) {
      form.setError('root', {
        type: 'custom',
        message: error.message,
      })
      return
    }

    await user?.updateProfile()

    // redirect on web is fine, back on native for better ux
    if (Platform.OS === 'web') {
      router.replace('/account/sendtag')
      return
    }

    router.back()
  }

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <SubmitButton
        theme="green"
        onPress={submit}
        py={'$5'}
        br={'$4'}
        disabled={!canSubmit}
        disabledStyle={{ opacity: 0.5 }}
      >
        <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'}>
          register
        </Button.Text>
      </SubmitButton>
    ),
    [canSubmit]
  )

  return (
    <YStack f={1} gap={'$3.5'}>
      <FormProvider {...form}>
        <Paragraph size={'$8'} fontWeight={500} tt={'uppercase'}>
          register your first sendtag
        </Paragraph>
        <Paragraph
          fontSize={'$5'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        >
          Own your identity on Send. Register up to 5 verified tags and make them yours.
        </Paragraph>
        <SchemaForm
          form={form}
          onSubmit={handleSubmit}
          schema={SendtagSchemaWithoutRestrictions}
          defaultValues={{
            name: '',
          }}
          props={{
            name: {
              placeholder: 'Input desired Sendtag',
              color: '$color12',
              fontWeight: '500',
              bw: 0,
              br: 0,
              p: 0,
              pl: '$2.5',

              focusStyle: {
                outlineWidth: 0,
              },
              '$theme-dark': {
                placeholderTextColor: '$darkGrayTextField',
              },
              '$theme-light': {
                placeholderTextColor: '$darkGrayTextField',
              },
              fontSize: '$5',
              onFocus: () => setIsInputFocused(true),
              onBlur: () => setIsInputFocused(false),
              fieldsetProps: {
                width: '100%',
              },
              iconBefore: (
                <Paragraph ml={-12} size={'$5'} opacity={formName ? 1 : 0}>
                  /
                </Paragraph>
              ),
            },
          }}
          formProps={{
            w: '100%',
            footerProps: { pb: 0 },
            $gtSm: {
              maxWidth: '100%',
            },
            style: { justifyContent: 'space-between' },
          }}
          renderAfter={renderAfterContent}
        >
          {({ name }) => {
            return (
              <YStack>
                <FadeCard
                  w={'100%'}
                  my={'$5'}
                  borderColor={validationError ? '$error' : 'transparent'}
                  bw={1}
                  pb={validationError ? '$5' : '$6'}
                >
                  <XStack position="relative">
                    {name}
                    <XStack
                      position="absolute"
                      bottom={0}
                      left={0}
                      right={0}
                      height={1}
                      backgroundColor={isInputFocused ? '$primary' : '$darkGrayTextField'}
                      $theme-light={{
                        backgroundColor: isInputFocused ? '$color12' : '$silverChalice',
                      }}
                    />
                  </XStack>
                  {validationError && (
                    <Paragraph color={'$error'}>{validationError.message}</Paragraph>
                  )}
                </FadeCard>
                <ReferredBy />
              </YStack>
            )
          }}
        </SchemaForm>
      </FormProvider>
    </YStack>
  )
}
