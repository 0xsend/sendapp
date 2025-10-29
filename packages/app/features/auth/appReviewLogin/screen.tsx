import { z } from 'zod'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { FormProvider, useForm } from 'react-hook-form'
import { useAuthScreenParams } from 'app/routers/params'
import { FadeCard, Paragraph, SubmitButton, XStack, YStack } from '@my/ui'
import { useEffect, useState } from 'react'
import { useAppReviewSignIn } from './useAppReviewSignIn'
import useAuthRedirect from 'app/utils/useAuthRedirect/useAuthRedirect'

const AppReviewSignInSchema = z.object({
  email: z.string().email(),
  password: formFields.text.min(1),
})

export const AppReviewLoginScreen = () => {
  const form = useForm<z.infer<typeof AppReviewSignInSchema>>()
  const [queryParams] = useAuthScreenParams()
  const { redirectUri } = queryParams
  const [isEmailFocused, setIsEmailFocused] = useState<boolean>(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState<boolean>(false)
  const { redirect } = useAuthRedirect()

  const formEmail = form.watch('email')
  const formPassword = form.watch('password')
  const validationError = form.formState.errors.root
  const canSubmit = formEmail && formPassword

  const { mutateAsync: signInMutateAsync, isPending } = useAppReviewSignIn()

  useEffect(() => {
    const subscription = form.watch(() => {
      form.clearErrors('root')
    })

    return () => subscription.unsubscribe()
  }, [form.watch, form.clearErrors])

  const handleSubmit = async (formData: z.infer<typeof AppReviewSignInSchema>) => {
    try {
      await signInMutateAsync(formData)
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
          App Review Login
        </Paragraph>
        <Paragraph
          size={'$4'}
          color={'$lightGrayTextField'}
          ta={'center'}
          $theme-light={{ color: '$darkGrayTextField' }}
          numberOfLines={3}
        >
          This is a special login screen for app reviewers. Please use the provided email and
          password credentials.
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
              schema={AppReviewSignInSchema}
              onSubmit={handleSubmit}
              defaultValues={{ email: '', password: '' }}
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
                email: {
                  testID: 'email-input',
                  placeholder: 'Email address',
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
                  onFocus: () => setIsEmailFocused(true),
                  onBlur: () => setIsEmailFocused(false),
                  fieldsetProps: {
                    f: 1,
                  },
                },
                password: {
                  testID: 'password-input',
                  placeholder: 'Password',
                  color: '$color12',
                  fontWeight: '500',
                  bw: 0,
                  br: 0,
                  p: 0,
                  pl: '$2.5',
                  secureTextEntry: true,
                  focusStyle: {
                    outlineWidth: 0,
                  },
                  placeholderTextColor: '$color4',
                  fontSize: '$5',
                  onFocus: () => setIsPasswordFocused(true),
                  onBlur: () => setIsPasswordFocused(false),
                  fieldsetProps: {
                    f: 1,
                  },
                },
              }}
            >
              {({ email, password }) => (
                <>
                  <YStack gap={'$3'}>
                    <YStack position="relative">
                      {email}
                      <XStack
                        position="absolute"
                        bottom={-8}
                        left={0}
                        right={0}
                        height={1}
                        backgroundColor={isEmailFocused ? '$primary' : '$darkGrayTextField'}
                        $theme-light={{
                          backgroundColor: isEmailFocused ? '$color12' : '$silverChalice',
                        }}
                      />
                    </YStack>
                    <YStack position="relative">
                      {password}
                      <XStack
                        position="absolute"
                        bottom={-8}
                        left={0}
                        right={0}
                        height={1}
                        backgroundColor={isPasswordFocused ? '$primary' : '$darkGrayTextField'}
                        $theme-light={{
                          backgroundColor: isPasswordFocused ? '$color12' : '$silverChalice',
                        }}
                      />
                    </YStack>
                  </YStack>
                  {validationError && (
                    <Paragraph color={'$error'}>{validationError.message}</Paragraph>
                  )}
                  <SubmitButton
                    onPress={() => form.handleSubmit(handleSubmit)()}
                    disabled={!canSubmit || isPending}
                  >
                    <SubmitButton.Text>{isPending ? 'Signing in...' : 'Sign In'}</SubmitButton.Text>
                  </SubmitButton>
                </>
              )}
            </SchemaForm>
          </FormProvider>
        </FadeCard>
      </YStack>
    </YStack>
  )
}
