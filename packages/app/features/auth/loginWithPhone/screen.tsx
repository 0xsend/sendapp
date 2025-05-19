import { z } from 'zod'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { useAuthScreenParams } from 'app/routers/params'
import {
  Button,
  ButtonText,
  FadeCard,
  LinkableButton,
  Paragraph,
  SubmitButton,
  XStack,
  YStack,
} from '@my/ui'
import { useCallback, useEffect, useState } from 'react'
import { api } from 'app/utils/api'
import { useSignIn } from 'app/utils/send-accounts'

const SignInWithPhoneSchema = z.object({
  countryCode: formFields.countrycode,
  phone: formFields.text.min(1).max(20),
})

export const LoginWithPhoneScreen = () => {
  const form = useForm<z.infer<typeof SignInWithPhoneSchema>>()
  const router = useRouter()
  const [queryParams] = useAuthScreenParams()
  const { redirectUri } = queryParams
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)

  const formPhone = form.watch('phone')
  const validationError = form.formState.errors.root
  const canSubmit = formPhone

  const { mutateAsync: signInMutateAsync } = useSignIn()
  const { mutateAsync: getCredentialByPhoneMutateAsync } =
    api.challenge.getCredentialByPhone.useMutation({
      retry: false,
    })

  useEffect(() => {
    const subscription = form.watch(() => {
      form.clearErrors('root')
    })

    return () => subscription.unsubscribe()
  }, [form.watch, form.clearErrors])

  const handleSubmit = async (formData: z.infer<typeof SignInWithPhoneSchema>) => {
    try {
      const allowedCredentials = await getCredentialByPhoneMutateAsync(formData)
      await signInMutateAsync({ allowedCredentials })
    } catch (error) {
      form.setError('root', {
        type: 'custom',
        message: error.message,
      })
      return
    }

    router.push(redirectUri ?? '/')
  }

  const renderAfter = useCallback(
    ({ submit }: { submit: () => void }) => (
      <SubmitButton
        alignSelf={'center'}
        w={'100%'}
        theme="green"
        onPress={submit}
        py={'$5'}
        br={'$4'}
        bw={'$1'}
        disabled={!canSubmit}
        $theme-light={{
          disabledStyle: { opacity: 0.5 },
        }}
        $theme-dark={{
          variant: canSubmit ? undefined : 'outlined',
        }}
        elevation={canSubmit ? '$0.75' : undefined}
      >
        <ButtonText
          ff={'$mono'}
          fontWeight={'500'}
          tt="uppercase"
          size={'$5'}
          color={canSubmit ? '$black' : '$primary'}
          $theme-light={{
            color: '$black',
          }}
        >
          login
        </ButtonText>
      </SubmitButton>
    ),
    [canSubmit]
  )

  return (
    <YStack f={1} jc={'space-between'} ai={'center'} gap={'$3.5'} py={'$10'}>
      <YStack w={'100%'} ai={'center'}>
        <FormProvider {...form}>
          <YStack w={'100%'} ai={'center'}>
            <Paragraph w={'100%'} size={'$8'} fontWeight={500} tt={'uppercase'}>
              login with your phone
            </Paragraph>
            <Paragraph w={'100%'} size={'$5'} color={'$olive'}>
              If you created your account with phone number, login using it
            </Paragraph>
          </YStack>
          <SchemaForm
            form={form}
            schema={SignInWithPhoneSchema}
            onSubmit={handleSubmit}
            defaultValues={{ phone: '', countryCode: '' }}
            formProps={{
              w: '100%',
              f: 0,
              footerProps: { pb: 0 },
              $gtSm: {
                maxWidth: '100%',
              },
              style: { justifyContent: 'space-between' },
            }}
            props={{
              phone: {
                testID: 'phone-number-input',
                placeholder: 'Input phone number',
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
                  f: 1,
                },
              },
            }}
            renderAfter={renderAfter}
          >
            {({ countryCode, phone }) => (
              <FadeCard
                elevation={'$0.75'}
                w={'100%'}
                mt={'$5'}
                borderColor={validationError ? '$error' : 'transparent'}
                bw={1}
                pb={validationError ? '$5' : '$6'}
              >
                <XStack position="relative" ai={'center'}>
                  {countryCode}
                  {phone}
                  <XStack
                    position="absolute"
                    bottom={-8}
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
            )}
          </SchemaForm>
        </FormProvider>
      </YStack>
      <LinkableButton
        href={'/auth/sign-up'}
        transparent
        chromeless
        backgroundColor="transparent"
        hoverStyle={{ backgroundColor: 'transparent' }}
        pressStyle={{ backgroundColor: 'transparent' }}
        focusStyle={{ backgroundColor: 'transparent' }}
        bw={0}
        br={0}
        height={'auto'}
      >
        <Button.Text
          color={'$primary'}
          $theme-light={{
            color: '$color12',
          }}
        >
          Sign up
        </Button.Text>
      </LinkableButton>
    </YStack>
  )
}
