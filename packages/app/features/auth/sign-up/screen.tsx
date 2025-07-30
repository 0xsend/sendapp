import {
  Anchor,
  Button,
  FadeCard,
  Label,
  LinkableButton,
  Paragraph,
  SubmitButton,
  useAppToast,
  useDebounce,
  XStack,
  YStack,
} from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import { Turnstile } from 'app/features/auth/sign-up/Turnstile'
import { useAuthScreenParams } from 'app/routers/params'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { api } from 'app/utils/api'
import { assert } from 'app/utils/assert'
import { formatErrorMessage } from 'app/utils/formatErrorMessage'
import { useCreateSendAccount, useSignIn } from 'app/utils/send-accounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useValidateSendtag } from 'app/utils/tags/useValidateSendtag'
import { useSetFirstSendtag } from 'app/utils/useFirstSendtag'
import { useUser } from 'app/utils/useUser'
import { useCallback, useEffect, useId, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { z } from 'zod'
import { useReferralCodeQuery } from 'app/utils/useReferralCode'
import { Platform } from 'react-native'

const SignUpScreenFormSchema = z.object({
  name: formFields.text,
  isAgreedToTerms: formFields.boolean_checkbox,
})

enum FormState {
  Idle = 'Idle',
  SigningIn = 'SigningIn',
  SigningUp = 'SigningUp',
}

export const SignUpScreen = () => {
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? undefined : 'DUMMY'
  )
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const [formState, setFormState] = useState<FormState>(FormState.Idle)
  const form = useForm<z.infer<typeof SignUpScreenFormSchema>>()
  const router = useRouter()
  const [queryParams, setAuthParams] = useAuthScreenParams()
  const toast = useAppToast()
  const supabase = useSupabase()
  const { user } = useUser()
  const termsCheckboxId = useId()
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')
  const { createSendAccount } = useCreateSendAccount()
  const { data: referralCode } = useReferralCodeQuery()

  const formName = form.watch('name')
  const formIsAgreedToTerms = form.watch('isAgreedToTerms')
  const validationError = form.formState.errors.root
  const canSubmit = formName && formIsAgreedToTerms && captchaToken

  const { mutateAsync: validateSendtagMutateAsync } = useValidateSendtag()
  const { mutateAsync: signInMutateAsync } = useSignIn()
  const { mutateAsync: signUpMutateAsync } = api.auth.signUp.useMutation({ retry: false })
  const { mutateAsync: registerFirstSendtagMutateAsync } =
    api.tag.registerFirstSendtag.useMutation()
  const { mutateAsync: setFirstSendtagMutateAsync } = useSetFirstSendtag()

  // Handle form changes and sync to URL
  const onFormChange = useDebounce(
    useCallback(
      (values) => {
        const { name } = values
        const trimmedName = name?.trim()

        // Always update the URL params, use undefined to remove empty values
        setAuthParams(
          {
            ...queryParams,
            tag: trimmedName || undefined,
          },
          { webBehavior: 'replace' }
        )
      },
      [setAuthParams, queryParams]
    ),
    300,
    { leading: false },
    []
  )

  useEffect(() => {
    const subscription = form.watch((values) => {
      form.clearErrors('root')
      onFormChange(values)
    })

    return () => {
      subscription.unsubscribe()
      onFormChange.cancel()
    }
  }, [form.watch, form.clearErrors, onFormChange])

  // Set initial tag value from URL parameter
  useEffect(() => {
    const currentFormValue = form.getValues('name')
    const urlTag = queryParams.tag
    if (urlTag && (!currentFormValue || currentFormValue === '')) {
      form.setValue('name', urlTag)
    }
  }, [queryParams.tag, form])

  useEffect(() => {
    if (user?.id && formState === FormState.Idle) {
      router.replace('/auth/onboarding')
    }
  }, [user?.id, router.replace, formState])

  const createAccount = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    assert(!!sessionData?.session?.user?.id, 'No user id')
    return await createSendAccount({ user: sessionData.session.user, accountName: formName })
  }

  const handleSubmit = async ({ name }: z.infer<typeof SignUpScreenFormSchema>) => {
    try {
      setFormState(FormState.SigningUp)
      const validatedSendtag = await validateSendtagMutateAsync({ name })

      const auth = await signUpMutateAsync({
        sendtag: validatedSendtag,
        captchaToken,
      })
      assert(!!auth.session, 'No session returned')
      supabase.auth.setSession(auth.session)

      await setFirstSendtagMutateAsync(validatedSendtag).catch((error) => {
        // don't interrupt flow if async storage is not available
        console.error('Unable to save sendtag into async storage: ', error.message)
      })

      const createdSendAccount = await createAccount()
      await registerFirstSendtagMutateAsync({
        name: validatedSendtag,
        sendAccountId: createdSendAccount.id,
        referralCode,
      })
      router.replace('/')
    } catch (error) {
      const message = formatErrorMessage(error).split('.')[0] ?? 'Unknown error'

      form.setError('root', {
        type: 'custom',
        message,
      })
      return
    } finally {
      setFormState(FormState.Idle)
    }
  }

  const handleSignIn = useCallback(async () => {
    setFormState(FormState.SigningIn)

    try {
      await signInMutateAsync({})
      router.push(queryParams.redirectUri ?? '/')
    } catch (error) {
      setFormState(FormState.Idle)
      toast.error(formatErrorMessage(error))
    }
  }, [signInMutateAsync, toast.error, router.push, queryParams.redirectUri])

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <YStack gap={'$3.5'}>
        <SubmitButton disabled={!canSubmit || formState !== FormState.Idle} onPress={submit}>
          <SubmitButton.Text>create account</SubmitButton.Text>
        </SubmitButton>
        <XStack w={'100%'} gap={'$2'} jc={'center'} ai={'center'}>
          <Paragraph $theme-light={{ color: '$darkGrayTextField' }}>
            Already have an account?
          </Paragraph>
          <Button
            onPress={handleSignIn}
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
            disabled={formState !== FormState.Idle}
          >
            <Button.Text
              color={'$primary'}
              $theme-light={{
                color: '$color12',
              }}
            >
              {formState === FormState.SigningIn ? 'Signing in...' : 'Sign in'}
            </Button.Text>
          </Button>
        </XStack>
      </YStack>
    ),
    [canSubmit, formState, handleSignIn]
  )

  return (
    <YStack f={1} jc={'center'} ai={'center'} gap={'$7'} w={'100%'}>
      <YStack ai={'center'} gap={'$2'}>
        <Paragraph w={'100%'} size={'$8'} fontWeight={600} ta={'center'}>
          Create your account
        </Paragraph>
        <Paragraph
          size={'$4'}
          color={'$lightGrayTextField'}
          ta={'center'}
          $theme-light={{ color: '$darkGrayTextField' }}
          numberOfLines={2}
        >
          Choose your Sendtag — your unique username on Send
        </Paragraph>
      </YStack>
      <FadeCard
        borderColor={validationError ? '$error' : 'transparent'}
        bw={1}
        fadeProps={{
          width: '100%',
          maxWidth: 550,
        }}
      >
        <FormProvider {...form}>
          <YStack w={'100%'} ai={'center'}>
            <SchemaForm
              form={form}
              onSubmit={handleSubmit}
              schema={SignUpScreenFormSchema}
              defaultValues={{
                name: queryParams.tag ?? '',
                isAgreedToTerms: false,
              }}
              props={{
                name: {
                  testID: 'sendtag-input',
                  placeholder: 'Enter your desired Sendtag',
                  color: '$color12',
                  fontWeight: '500',
                  bw: 0,
                  br: 0,
                  p: 0,
                  pl: '$2.5',
                  onChangeText: (text: string) => form.setValue('name', text),
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
                    <XStack
                      ml={Platform.OS === 'web' ? -12 : 4}
                      opacity={formName ? 1 : 0}
                      mb={Platform.OS === 'web' ? 0 : 2}
                    >
                      <Paragraph size={'$5'}>/</Paragraph>
                    </XStack>
                  ),
                  iconBeforeProps: {
                    padding: 0,
                    paddingLeft: Platform.OS === 'web' ? '$3' : 0,
                  },
                },
                isAgreedToTerms: {
                  id: termsCheckboxId,
                },
              }}
              formProps={{
                w: '100%',
                footerProps: { padding: 0 },
                $gtSm: {
                  maxWidth: '100%',
                },
                style: { justifyContent: 'space-between' },
              }}
              renderAfter={renderAfterContent}
            >
              {({ name, isAgreedToTerms }) => {
                return (
                  <YStack gap={'$2'}>
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
                    <XStack gap={'$2'} ai={'center'}>
                      {isAgreedToTerms}
                      <Label
                        cursor={'pointer'}
                        size={'$4'}
                        htmlFor={termsCheckboxId}
                        color={'$lightGrayTextField'}
                        $theme-light={{ color: '$darkGrayTextField' }}
                        pressStyle={{
                          color: isDarkTheme ? '$lightGrayTextField' : '$darkGrayTextField',
                        }}
                      >
                        I agree to the&nbsp;
                        <Anchor
                          size={'$4'}
                          href={'https://support.send.app/en/articles/10916356-privacy-policy'}
                          target="_blank"
                          textDecorationLine="underline"
                          color={'$primary'}
                          $theme-light={{ color: '$darkGrayTextField' }}
                        >
                          Privacy Policy
                        </Anchor>
                        &nbsp;and&nbsp;
                        <Anchor
                          size={'$4'}
                          href={'https://support.send.app/en/articles/10916009-terms-of-service'}
                          target="_blank"
                          textDecorationLine="underline"
                          color={'$primary'}
                          $theme-light={{ color: '$darkGrayTextField' }}
                        >
                          Terms
                        </Anchor>
                      </Label>
                    </XStack>
                    {validationError && (
                      <Paragraph color={'$error'}>{validationError.message}</Paragraph>
                    )}
                  </YStack>
                )
              }}
            </SchemaForm>
          </YStack>
        </FormProvider>
      </FadeCard>
      <YStack w={'100%'} ai={'center'} gap={Platform.OS === 'web' ? '$5' : 0}>
        <Turnstile onSuccess={(t) => setCaptchaToken(t)} />
        <LinkableButton
          href={'/auth/login-with-phone'}
          transparent
          chromeless
          backgroundColor="transparent"
          hoverStyle={{ backgroundColor: 'transparent' }}
          pressStyle={{ backgroundColor: 'transparent' }}
          focusStyle={{ backgroundColor: 'transparent' }}
          bw={0}
          br={0}
          height={'auto'}
          disabled={formState !== FormState.Idle}
        >
          <Button.Text
            size={'$4'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
            ta={'center'}
            numberOfLines={2}
          >
            Need help? Try login with phone number
          </Button.Text>
        </LinkableButton>
      </YStack>
    </YStack>
  )
}
