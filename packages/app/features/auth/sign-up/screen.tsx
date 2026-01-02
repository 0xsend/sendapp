import {
  Anchor,
  Button,
  FadeCard,
  Label,
  LinkableButton,
  Paragraph,
  Spinner,
  SubmitButton,
  useAppToast,
  useDebounce,
  useMedia,
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
import {
  PASSKEY_DIAGNOSTIC_ERROR_MESSAGE,
  PASSKEY_DIAGNOSTIC_TOAST_MESSAGE,
} from 'app/utils/passkeyDiagnostic'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useValidateSendtag } from 'app/utils/tags/useValidateSendtag'
import { useSetFirstSendtag } from 'app/utils/useFirstSendtag'
import { useUser } from 'app/utils/useUser'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { z } from 'zod'
import { useReferralCodeQuery } from 'app/utils/useReferralCode'
import { ReferrerBanner } from 'app/components/ReferrerBanner'
import { Platform } from 'react-native'
import useIsScreenFocused from 'app/utils/useIsScreenFocused'
import useAuthRedirect from 'app/utils/useAuthRedirect/useAuthRedirect'
import { AlertTriangle, CheckCircle } from '@tamagui/lucide-icons'
import { useAnalytics } from 'app/provider/analytics'

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
  const isScreenFocused = useIsScreenFocused()
  const { xxs } = useMedia()
  const { redirect } = useAuthRedirect()
  const analytics = useAnalytics()
  const passkeyDiagnosticErrorMessage = PASSKEY_DIAGNOSTIC_ERROR_MESSAGE
  const PASSKEY_TOAST_ID = 'passkey-integrity-signup'
  const [diagnosticStatus, setDiagnosticStatus] = useState<
    'idle' | 'running' | 'success' | 'failure'
  >('idle')
  const hasTrackedSignupStarted = useRef(false)
  const [diagnosticMessage, setDiagnosticMessage] = useState<string | null>(null)
  const [hasCompletedPasskey, setHasCompletedPasskey] = useState(false)
  const hasSignedUpRef = useRef(false)

  const formName = form.watch('name')
  const formIsAgreedToTerms = form.watch('isAgreedToTerms')
  const validationError = form.formState.errors.root
  const canSubmit = formName && formIsAgreedToTerms && captchaToken
  const canRetryDiagnostic = diagnosticStatus === 'failure' && formState === FormState.Idle

  const { mutateAsync: validateSendtagMutateAsync } = useValidateSendtag({ isFirstTag: true })
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
  }, [form, onFormChange])

  // Set initial tag value from URL parameter
  useEffect(() => {
    const currentFormValue = form.getValues('name')
    const urlTag = queryParams.tag
    if (urlTag && (!currentFormValue || currentFormValue === '')) {
      form.setValue('name', urlTag)
    }
  }, [queryParams.tag, form])

  const createAccount = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    assert(!!sessionData?.session?.user?.id, 'No user id')
    return sessionData.session.user
  }, [supabase.auth])

  useEffect(() => {
    const isUserRejectError = (value: unknown) => {
      if (!value) return false
      const text =
        typeof value === 'string' ? value : value instanceof Error ? value.message : String(value)
      return text.includes('REQUEST_REJECTION_FAILED') || text.includes('User clicked reject')
    }

    const errorHandler = (event: ErrorEvent) => {
      if (isUserRejectError(event.message) || isUserRejectError(event.error)) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      if (isUserRejectError(event.reason)) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }

    let previousOnError: Window['onerror'] = null
    let previousOnUnhandledRejection: Window['onunhandledrejection'] = null
    let previousConsoleError: ((...args: unknown[]) => void) | null = null

    const onError: OnErrorEventHandler = (message, source, lineno, colno, error) => {
      if (isUserRejectError(error) || isUserRejectError(message)) {
        return true
      }
      if (typeof previousOnError === 'function') {
        return previousOnError.call(window, message, source, lineno, colno, error)
      }
      return false
    }

    const onUnhandled = ((event: PromiseRejectionEvent) => {
      if (isUserRejectError(event.reason)) {
        event.preventDefault()
        return true
      }
      if (typeof previousOnUnhandledRejection === 'function') {
        return previousOnUnhandledRejection.call(window, event)
      }
      return false
    }) as Exclude<Window['onunhandledrejection'], null>

    if (process.env.TAMAGUI_TARGET === 'web') {
      window.addEventListener('error', errorHandler, { capture: true })
      window.addEventListener('unhandledrejection', rejectionHandler, { capture: true })
      previousOnError = window.onerror
      previousOnUnhandledRejection = window.onunhandledrejection
      previousConsoleError = console.error
      window.onerror = onError
      window.onunhandledrejection = onUnhandled
      console.error = (...args: unknown[]) => {
        if (args.some((arg) => isUserRejectError(arg))) {
          return
        }
        previousConsoleError?.(...args)
      }
    }

    return () => {
      if (process.env.TAMAGUI_TARGET === 'web') {
        window.removeEventListener('error', errorHandler, { capture: true } as EventListenerOptions)
        window.removeEventListener('unhandledrejection', rejectionHandler, {
          capture: true,
        } as EventListenerOptions)
        window.onerror = previousOnError ?? null
        window.onunhandledrejection = previousOnUnhandledRejection ?? null
      }
      if (previousConsoleError) {
        console.error = previousConsoleError
      }
    }
  }, [])

  const handleSubmit = useCallback(
    async ({ name }: z.infer<typeof SignUpScreenFormSchema>) => {
      try {
        setFormState(FormState.SigningUp)
        setHasCompletedPasskey(false)
        setDiagnosticStatus('idle')
        setDiagnosticMessage(null)

        // Track user_signup_started once per session
        if (!hasTrackedSignupStarted.current) {
          analytics.capture({
            name: 'user_signup_started',
            properties: {
              has_referral: !!referralCode,
              auth_type: 'passkey',
            },
          })
          hasTrackedSignupStarted.current = true
        }

        const validatedSendtag = await validateSendtagMutateAsync({ name })

        if (!hasSignedUpRef.current) {
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

          hasSignedUpRef.current = true
        }

        const sessionUser = await createAccount()

        const createdSendAccount = await createSendAccount({
          user: sessionUser,
          accountName: validatedSendtag,
          passkeyDiagnosticCallbacks: {
            onStart: () => {
              setDiagnosticStatus('running')
              setDiagnosticMessage("Checking your passkey's signing integrity...")
              toast.hide()
              toast.show("Checking your passkey's signing integrity...", {
                id: PASSKEY_TOAST_ID,
                duration: 6000,
              })
            },
            onSuccess: () => {
              setDiagnosticStatus('success')
              setDiagnosticMessage('Passkey integrity check passed.')
              toast.hide()
              toast.show('Passkey integrity check passed.', {
                id: PASSKEY_TOAST_ID,
              })
            },
            onFailure: () => {
              setFormState(FormState.Idle)
              setHasCompletedPasskey(false)
              setDiagnosticStatus('failure')
              setDiagnosticMessage(passkeyDiagnosticErrorMessage)
              toast.hide()
              toast.error(PASSKEY_DIAGNOSTIC_TOAST_MESSAGE, {
                id: PASSKEY_TOAST_ID,
                duration: 8000,
              })
              form.setError('root', {
                type: 'custom',
                message: passkeyDiagnosticErrorMessage,
              })
            },
          },
        })

        if (!createdSendAccount) {
          return
        }
        await registerFirstSendtagMutateAsync({
          name: validatedSendtag,
          sendAccountId: createdSendAccount.id,
          referralCode,
        })
        setHasCompletedPasskey(true)

        // Fetch profile to get send_id for analytics
        const { data: profileData } = await supabase
          .from('profiles')
          .select('send_id')
          .eq('id', sessionUser.id)
          .single()

        // Identify user and capture sign-up event
        const sendId = String(profileData?.send_id ?? '')
        analytics.identify(sendId, {
          sendtag: validatedSendtag,
          has_referral: !!referralCode,
        })
        analytics.capture({
          name: 'user_signed_up',
          properties: {
            sendtag: validatedSendtag,
            has_referral: !!referralCode,
            send_account_id: sendId,
          },
        })

        redirect()
      } catch (error) {
        setFormState(FormState.Idle)

        if (
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof (error as { message?: unknown }).message === 'string'
        ) {
          const messageText = (error as Error).message
          if (
            messageText.includes('REQUEST_REJECTION_FAILED') ||
            messageText.includes('User clicked reject')
          ) {
            setHasCompletedPasskey(false)
            setDiagnosticStatus('failure')
            setDiagnosticMessage(passkeyDiagnosticErrorMessage)
            toast.hide()
            toast.error(PASSKEY_DIAGNOSTIC_TOAST_MESSAGE, {
              id: PASSKEY_TOAST_ID,
              duration: 8000,
            })
            form.setError('root', {
              type: 'custom',
              message: passkeyDiagnosticErrorMessage,
            })

            // Track passkey integrity failure
            analytics.capture({
              name: 'passkey_integrity_failed',
              properties: {
                error_type: 'user_rejection',
              },
            })
            return
          }
        }

        const message = formatErrorMessage(error).trim() || 'Unknown error'

        form.setError('root', {
          type: 'custom',
          message,
        })
        setDiagnosticStatus('idle')
        setDiagnosticMessage(null)
        setHasCompletedPasskey(false)

        // Track auth error
        analytics.capture({
          name: 'auth_error_occurred',
          properties: {
            error_message: message,
            auth_type: 'sign_up',
          },
        })
        analytics.captureException(error instanceof Error ? error : new Error(message))
        return
      }
    },
    [
      analytics,
      captchaToken,
      createAccount,
      createSendAccount,
      form,
      passkeyDiagnosticErrorMessage,
      redirect,
      referralCode,
      registerFirstSendtagMutateAsync,
      setFirstSendtagMutateAsync,
      signUpMutateAsync,
      supabase,
      toast,
      validateSendtagMutateAsync,
    ]
  )

  useEffect(() => {
    if (user?.id && formState === FormState.Idle && isScreenFocused && hasCompletedPasskey) {
      router.replace('/auth/onboarding')
    }
  }, [user?.id, router, formState, isScreenFocused, hasCompletedPasskey])

  const diagnosticIndicator = useMemo(() => {
    if (diagnosticStatus === 'idle') return null

    const indicatorMessage =
      diagnosticMessage ??
      (diagnosticStatus === 'running'
        ? "Checking your passkey's signing integrity..."
        : 'Passkey integrity check complete.')

    return (
      <YStack ai={'center'} gap={'$2'} alignSelf="stretch">
        <XStack ai={'center'} gap={'$2'} jc={'center'}>
          {diagnosticStatus === 'running' ? (
            <Spinner size="small" />
          ) : diagnosticStatus === 'success' ? (
            <CheckCircle size={18} color="$green10" />
          ) : (
            <AlertTriangle size={18} color="$error" />
          )}
          <Paragraph ta="center" color={diagnosticStatus === 'failure' ? '$error' : '$color12'}>
            {indicatorMessage}
          </Paragraph>
        </XStack>
        {diagnosticStatus === 'failure' && (
          <Button
            size="$3"
            backgroundColor="$primary"
            color="$black"
            hoverStyle={{ backgroundColor: '$primary', opacity: 0.9 }}
            disabled={!canRetryDiagnostic}
            onPress={() => form.handleSubmit(handleSubmit)()}
          >
            Retry integrity check
          </Button>
        )}
      </YStack>
    )
  }, [diagnosticStatus, diagnosticMessage, canRetryDiagnostic, form, handleSubmit])

  const handleSignIn = useCallback(async () => {
    setFormState(FormState.SigningIn)

    try {
      await signInMutateAsync({})

      // Track passkey login success
      analytics.capture({
        name: 'user_login_succeeded',
        properties: {
          auth_type: 'passkey',
        },
      })

      redirect(queryParams.redirectUri)
    } catch (error) {
      setFormState(FormState.Idle)
      toast.error(formatErrorMessage(error))
    }
  }, [signInMutateAsync, toast, redirect, queryParams.redirectUri, analytics])

  return (
    <YStack f={1} jc={'center'} ai={'center'} gap={xxs ? '$3.5' : '$7'} w={'100%'}>
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
        <ReferrerBanner />
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
                  lineHeight: 21,
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
                  placeholderTextColor: '$gray9',
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
                ...(Platform.OS !== 'web' && {
                  minHeight: 'auto',
                  height: 'auto',
                  flex: 0,
                }),
                style: { justifyContent: 'space-between' },
              }}
            >
              {({ name, isAgreedToTerms }) => {
                return (
                  <>
                    <YStack gap={'$3.5'}>
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
                          lineHeight={16}
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
                      {validationError && diagnosticStatus !== 'failure' && (
                        <Paragraph color={'$error'}>{validationError.message}</Paragraph>
                      )}
                    </YStack>
                    <YStack gap={'$3.5'}>
                      <SubmitButton
                        disabled={
                          !canSubmit ||
                          formState !== FormState.Idle ||
                          diagnosticStatus === 'failure'
                        }
                        onPress={() => form.handleSubmit(handleSubmit)()}
                      >
                        <SubmitButton.Text>create account</SubmitButton.Text>
                      </SubmitButton>
                      {diagnosticIndicator}
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
                  </>
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
