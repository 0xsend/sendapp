/**
 * Onboarding screen will ultimately be the first screen a user sees when they open the app or after they sign up.
 *
 * It needs to:
 * - Introduce to Send
 * - Create a passkey
 * - Generate a deterministic address from the public key
 * - Ask the user to deposit funds
 */
import { FadeCard, Paragraph, SubmitButton, XStack, YStack } from '@my/ui'
import { useUser } from 'app/utils/useUser'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreateSendAccount, useSendAccount } from 'app/utils/send-accounts'
import { useRouter } from 'solito/router'
import { useCallback, useEffect, useState } from 'react'
import { useIsClient } from 'app/utils/useIsClient'
import { api } from 'app/utils/api'
import { assert } from 'app/utils/assert'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { useValidateSendtag } from 'app/utils/tags/useValidateSendtag'
import { formatErrorMessage } from 'app/utils/formatErrorMessage'
import { useFirstSendtagQuery } from 'app/utils/useFirstSendtag'
import { useReferralCodeQuery } from 'app/utils/useReferralCode'
import { Platform } from 'react-native'

const OnboardingSchema = z.object({
  name: formFields.text,
})

export function OnboardingScreen() {
  const { user, validateToken } = useUser()
  const form = useForm<z.infer<typeof OnboardingSchema>>()
  const sendAccount = useSendAccount()
  const { replace } = useRouter()
  const { createSendAccount } = useCreateSendAccount()
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const isClient = useIsClient()
  const { data: firstSendtag } = useFirstSendtagQuery()
  const { data: referralCode } = useReferralCodeQuery()

  const formName = form.watch('name')
  const validationError = form.formState.errors.root
  const canSubmit = formName

  const { mutateAsync: validateSendtagMutateAsync } = useValidateSendtag()
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
      const createdSendAccount = await createSendAccount({ user, accountName: name })
      await registerFirstSendtagMutateAsync({
        name,
        sendAccountId: createdSendAccount.id,
        referralCode,
      })
      replace('/')
    } catch (error) {
      console.error('Error creating account', error)

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

      const message = formatErrorMessage(error).split('.')[0] ?? 'Unknown error'

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
    }
  }

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <SubmitButton onPress={submit} disabled={!canSubmit}>
        <SubmitButton.Text>finish account</SubmitButton.Text>
      </SubmitButton>
    ),
    [canSubmit]
  )

  // If we're not in the client, or the user isn't available, don't render
  if (!isClient) return null

  return (
    <YStack f={1} jc={'center'} ai={'center'} gap={'$5'} pb={100}>
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
                style: { justifyContent: 'space-between' },
              }}
              renderAfter={renderAfterContent}
            >
              {({ name }) => {
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
    </YStack>
  )
}
