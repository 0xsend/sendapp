/**
 * Onboarding screen will ultimately be the first screen a user sees when they open the app or after they sign up.
 *
 * It needs to:
 * - Introduce to Send
 * - Create a passkey
 * - Generate a deterministic address from the public key
 * - Ask the user to deposit funds
 */
import {
  Button,
  FadeCard,
  Paragraph,
  Spinner,
  SubmitButton,
  XStack,
  YStack,
  useAppToast,
} from '@my/ui'
import {
  PASSKEY_DIAGNOSTIC_ERROR_MESSAGE,
  PASSKEY_DIAGNOSTIC_TOAST_MESSAGE,
} from 'app/utils/passkeyDiagnostic'
import { useUser } from 'app/utils/useUser'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreateSendAccount, useSendAccount } from 'app/utils/send-accounts'
import { useRouter } from 'solito/router'
import { useEffect, useMemo, useState } from 'react'
import { useIsClient } from 'app/utils/useIsClient'
import { api } from 'app/utils/api'
import { assert } from 'app/utils/assert'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { useValidateSendtag } from 'app/utils/tags/useValidateSendtag'
import { formatErrorMessage } from 'app/utils/formatErrorMessage'
import { useFirstSendtagQuery } from 'app/utils/useFirstSendtag'
import { useReferralCodeQuery } from 'app/utils/useReferralCode'
import { Platform } from 'react-native'
import useAuthRedirect from 'app/utils/useAuthRedirect/useAuthRedirect'
import { AlertTriangle, CheckCircle } from '@tamagui/lucide-icons'

const OnboardingSchema = z.object({
  name: formFields.text,
})

export function OnboardingScreen() {
  const { user, validateToken } = useUser()
  const form = useForm<z.infer<typeof OnboardingSchema>>()
  const sendAccount = useSendAccount()
  const { replace } = useRouter()
  const { createSendAccount } = useCreateSendAccount()
  const toast = useAppToast()
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const [diagnosticStatus, setDiagnosticStatus] = useState<
    'idle' | 'running' | 'success' | 'failure'
  >('idle')
  const [diagnosticMessage, setDiagnosticMessage] = useState<string | null>(null)
  const passkeyDiagnosticErrorMessage = PASSKEY_DIAGNOSTIC_ERROR_MESSAGE
  const PASSKEY_TOAST_ID = 'passkey-integrity'
  const isClient = useIsClient()
  const { data: firstSendtag } = useFirstSendtagQuery()
  const { data: referralCode } = useReferralCodeQuery()
  const { redirect } = useAuthRedirect()

  const formName = form.watch('name')
  const validationError = form.formState.errors.root
  const canSubmit = formName

  const canRetryDiagnostic = diagnosticStatus === 'failure' && !form.formState.isSubmitting

  const diagnosticIndicator = useMemo(() => {
    if (diagnosticStatus === 'idle') return null

    const baseProps = {
      ai: 'center' as const,
      gap: '$2' as const,
      alignSelf: 'stretch' as const,
    }

    const contentProps = {
      ai: 'center' as const,
      gap: '$2' as const,
      jc: 'center' as const,
    }

    const indicatorMessage =
      diagnosticMessage ??
      (diagnosticStatus === 'running'
        ? "Checking your passkey's signing integrity..."
        : 'Passkey integrity check complete.')

    return (
      <YStack {...baseProps}>
        <XStack {...contentProps}>
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
            onPress={() => form.handleSubmit(handleSubmit)()}
            disabled={!canRetryDiagnostic}
            testID="passkey-diagnostic-retry"
          >
            Retry integrity check
          </Button>
        )}
      </YStack>
    )
  }, [diagnosticStatus, diagnosticMessage, canRetryDiagnostic, form])

  const { mutateAsync: validateSendtagMutateAsync } = useValidateSendtag({ isFirstTag: true })
  const { mutateAsync: registerFirstSendtagMutateAsync } =
    api.tag.registerFirstSendtag.useMutation()

  // Validate the token when this component mounts
  useEffect(() => {
    async function checkTokenValidity() {
      // Only continue if we have what appears to be a user
      if (!user?.id) {
        replace('/')
        return
      }

      // Validate token to ensure it's still valid
      const isValid = await validateToken()
      if (!isValid) {
        // Token validation handles redirect in useUser
        return
      }
    }

    checkTokenValidity()
  }, [user?.id, validateToken, replace])

  useEffect(() => {
    if (sendAccount.data?.address) {
      replace('/') // redirect to home page if account already exists
    }
  }, [sendAccount.data?.address, replace])

  useEffect(() => {
    if (firstSendtag) {
      form.setValue('name', firstSendtag)
    }
  }, [firstSendtag, form.setValue])

  useEffect(() => {
    const subscription = form.watch(() => {
      form.clearErrors('root')
    })

    return () => subscription.unsubscribe()
  }, [form.watch, form.clearErrors])

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

    if (typeof window !== 'undefined') {
      window.addEventListener('error', errorHandler, { capture: true })
      window.addEventListener('unhandledrejection', rejectionHandler, { capture: true })
      previousOnError = window.onerror
      previousOnUnhandledRejection = window.onunhandledrejection
      window.onerror = onError
      window.onunhandledrejection = onUnhandled
      previousConsoleError = console.error
      console.error = (...args: unknown[]) => {
        if (args.some((arg) => isUserRejectError(arg))) {
          return
        }
        previousConsoleError?.(...args)
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
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

  async function handleSubmit({ name }: z.infer<typeof OnboardingSchema>) {
    try {
      // First, validate token
      const isTokenValid = await validateToken()
      if (!isTokenValid) {
        // Token validation already handles redirection
        return
      }

      assert(!!user?.id, 'No user id')

      await validateSendtagMutateAsync({ name })

      setDiagnosticStatus('idle')
      setDiagnosticMessage(null)

      const createdSendAccount = await createSendAccount({
        user,
        accountName: name,
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
        name,
        sendAccountId: createdSendAccount.id,
        referralCode,
      })
      redirect()
    } catch (error) {
      console.error('Error creating account', error)

      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string' &&
        (error as Error).message.includes('REQUEST_REJECTION_FAILED')
      ) {
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
        return
      }

      // Check for authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        form.setError('root', {
          type: 'custom',
          message: 'Session expired. Redirecting to sign in...',
        })
        setTimeout(() => {
          replace('/')
        }, 1500)
        return
      }

      const message = formatErrorMessage(error).trim() || 'Unknown error'

      // Check for "No user id" which means token is invalid
      if (message.includes('No user id')) {
        form.setError('root', {
          type: 'custom',
          message: 'Session expired. Redirecting to sign in...',
        })
        setTimeout(() => {
          replace('/')
        }, 1500)
        return
      }

      form.setError('root', {
        type: 'custom',
        message,
      })
      setDiagnosticStatus('idle')
      setDiagnosticMessage(null)
    }
  }

  // If we're not in the client, or the user isn't available, don't render
  if (!isClient) return null

  return (
    <YStack f={1} jc={'center'} ai={'center'} gap={'$5'}>
      <YStack ai={'center'} gap={'$2'}>
        <Paragraph w={'100%'} size={'$8'} fontWeight={600} ta={'center'}>
          Finish your account
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
              schema={OnboardingSchema}
              defaultValues={{
                name: firstSendtag || '',
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
                  testID: 'sendtag-input',
                  fieldsetProps: {
                    width: '100%',
                  },
                  iconBefore: (
                    <XStack
                      ml={Platform.OS === 'web' ? -12 : 4}
                      mb={Platform.OS === 'web' ? 0 : 2}
                      opacity={formName ? 1 : 0}
                    >
                      <Paragraph size={'$5'}>/</Paragraph>
                    </XStack>
                  ),
                },
              }}
              formProps={{
                w: '100%',
                footerProps: { p: 0 },
                $gtSm: {
                  maxWidth: '100%',
                },
                ...(Platform.OS === 'android' && {
                  minHeight: 'auto',
                  height: 'auto',
                  flex: 0,
                }),
                style: { justifyContent: 'space-between' },
              }}
            >
              {({ name }) => {
                return (
                  <>
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
                      {validationError && diagnosticStatus !== 'failure' && (
                        <Paragraph color={'$error'}>{validationError.message}</Paragraph>
                      )}
                    </YStack>
                    <SubmitButton
                      onPress={() => form.handleSubmit(handleSubmit)()}
                      disabled={!canSubmit || diagnosticStatus === 'failure'}
                    >
                      <SubmitButton.Text>finish account</SubmitButton.Text>
                    </SubmitButton>
                    {diagnosticIndicator}
                  </>
                )
              }}
            </SchemaForm>
          </YStack>
        </FormProvider>
      </FadeCard>
    </YStack>
  )
}
