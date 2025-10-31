import { z } from 'zod'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { useAuthScreenParams } from 'app/routers/params'
import { Button, FadeCard, LinkableButton, Paragraph, SubmitButton, XStack, YStack } from '@my/ui'
import { useEffect, useState } from 'react'
import { api } from 'app/utils/api'
import { useSignIn } from 'app/utils/send-accounts'
import { Platform } from 'react-native'
import useAuthRedirect from 'app/utils/useAuthRedirect/useAuthRedirect'

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
  const { redirect } = useAuthRedirect()

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
  }, [form])

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

    redirect(redirectUri)
  }

  return (
    <YStack f={1} jc={'center'} ai={'center'} gap={'$5'}>
      <YStack ai={'center'} gap={'$2'}>
        <Paragraph w={'100%'} size={'$8'} fontWeight={600} ta={'center'}>
          Login with your phone
        </Paragraph>
        <Paragraph
          size={'$4'}
          color={'$lightGrayTextField'}
          ta={'center'}
          $theme-light={{ color: '$darkGrayTextField' }}
          numberOfLines={2}
        >
          If you created your account with phone number, login using it
        </Paragraph>
      </YStack>
      <YStack w={'100%'} ai={'center'}>
        <FadeCard
          fadeProps={{
            width: '100%',
            maxWidth: 550,
          }}
          borderColor={validationError ? '$error' : 'transparent'}
          bw={1}
        >
          <FormProvider {...form}>
            <SchemaForm
              form={form}
              schema={SignInWithPhoneSchema}
              onSubmit={handleSubmit}
              defaultValues={{ phone: '', countryCode: '' }}
              formProps={{
                w: '100%',
                f: 0,
                footerProps: { p: 0 },
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
                  placeholderTextColor: '$color4',
                  fontSize: '$5',
                  onFocus: () => setIsInputFocused(true),
                  onBlur: () => setIsInputFocused(false),
                  fieldsetProps: {
                    f: 1,
                  },
                },
              }}
            >
              {({ countryCode, phone }) => (
                <>
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
                  <SubmitButton
                    onPress={() => form.handleSubmit(handleSubmit)()}
                    disabled={!canSubmit}
                  >
                    <SubmitButton.Text>login</SubmitButton.Text>
                  </SubmitButton>
                </>
              )}
            </SchemaForm>
          </FormProvider>
          <XStack w={'100%'} gap={'$2'} jc={'center'} ai={'center'}>
            <Paragraph $theme-light={{ color: '$darkGrayTextField' }}>
              Don&apos;t have account yet?
            </Paragraph>
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
              p={0}
              {...(Platform.OS !== 'web' // on native go back instead of /auth/sign-up, better ux using stack navigation
                ? {
                    onPress: () => {
                      router.back()
                    },
                  }
                : {})}
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
          </XStack>
        </FadeCard>
      </YStack>
    </YStack>
  )
}
