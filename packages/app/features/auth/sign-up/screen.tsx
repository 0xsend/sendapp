import {
  Anchor,
  Button,
  FadeCard,
  Label,
  LinkableButton,
  Paragraph,
  Separator,
  SubmitButton,
  useToastController,
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
  const [queryParams] = useAuthScreenParams()
  const { redirectUri } = queryParams
  const toast = useToastController()
  const supabase = useSupabase()
  const { user } = useUser()
  const termsCheckboxId = useId()
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')
  const { createSendAccount } = useCreateSendAccount()

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

  useEffect(() => {
    const subscription = form.watch(() => {
      form.clearErrors('root')
    })

    return () => subscription.unsubscribe()
  }, [form.watch, form.clearErrors])

  useEffect(() => {
    if (user?.id && formState === FormState.Idle) {
      router.replace('/auth/onboarding')
    }
  }, [user?.id, router.replace, formState])

  const createAccount = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    assert(!!sessionData?.session?.user?.id, 'No user id')
    await createSendAccount({ user: sessionData.session.user, accountName: formName })
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

      await createAccount()
      await registerFirstSendtagMutateAsync({ name: validatedSendtag })
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
      router.push(redirectUri ?? '/')
    } catch (error) {
      toast.show(formatErrorMessage(error), {
        preset: 'error',
        isUrgent: true,
        duration: 10000000,
      })
    } finally {
      setFormState(FormState.Idle)
    }
  }, [signInMutateAsync, toast.show, router.push, redirectUri])

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <YStack>
        <SubmitButton
          elevation={'$0.75'}
          alignSelf={'center'}
          w={'100%'}
          theme="green"
          onPress={submit}
          py={'$5'}
          br={'$4'}
          bw={'$1'}
          disabled={!canSubmit || formState !== FormState.Idle}
          $theme-light={{
            disabledStyle: { opacity: 0.5 },
          }}
          $theme-dark={{
            variant: canSubmit ? undefined : 'outlined',
          }}
        >
          <Button.Text
            ff={'$mono'}
            fontWeight={'500'}
            tt="uppercase"
            size={'$5'}
            color={canSubmit ? '$black' : '$primary'}
            $theme-light={{
              color: '$black',
            }}
          >
            create account
          </Button.Text>
        </SubmitButton>
        <YStack w={'100%'} gap={'$3.5'} mt={'$3.5'}>
          <XStack w={'100%'} gap={'$3.5'} ai={'center'}>
            <Separator bc={'$color10'} />
            <Paragraph tt={'uppercase'}>or</Paragraph>
            <Separator bc={'$color10'} />
          </XStack>
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
        </YStack>
      </YStack>
    ),
    [canSubmit, formState, handleSignIn]
  )

  return (
    <YStack f={1} jc={'space-around'} ai={'center'} gap={'$3.5'} pt={'$5'}>
      <FormProvider {...form}>
        <YStack w={'100%'} ai={'center'}>
          <Paragraph w={'100%'} size={'$8'} fontWeight={500} tt={'uppercase'}>
            create your account
          </Paragraph>
          <Paragraph w={'100%'} size={'$5'} color={'$olive'}>
            Choose your Sendtag — your unique username on Send.
          </Paragraph>
          <SchemaForm
            form={form}
            onSubmit={handleSubmit}
            schema={SignUpScreenFormSchema}
            defaultValues={{
              name: '',
              isAgreedToTerms: false,
            }}
            props={{
              name: {
                testID: 'sendtag-input',
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
              isAgreedToTerms: {
                id: termsCheckboxId,
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
            {({ name, isAgreedToTerms }) => {
              return (
                <FadeCard
                  w={'100%'}
                  mt={'$5'}
                  borderColor={validationError ? '$error' : 'transparent'}
                  bw={1}
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
                  <XStack gap={'$2'} ai={'center'}>
                    {isAgreedToTerms}
                    <Label
                      cursor={'pointer'}
                      size={'$5'}
                      htmlFor={termsCheckboxId}
                      color={'$lightGrayTextField'}
                      lineHeight={'$5'}
                      $theme-light={{ color: '$darkGrayTextField' }}
                      pressStyle={{
                        color: isDarkTheme ? '$lightGrayTextField' : '$darkGrayTextField',
                      }}
                    >
                      Agree to&nbsp;
                      <Anchor
                        size={'$5'}
                        href={'https://support.send.app/en/articles/10916356-privacy-policy'}
                        target="_blank"
                        textDecorationLine="underline"
                        color={'$primary'}
                        $theme-light={{ color: '$color12' }}
                      >
                        Privacy
                      </Anchor>
                      &nbsp;and&nbsp;
                      <Anchor
                        size={'$5'}
                        href={'https://support.send.app/en/articles/10916009-terms-of-service'}
                        target="_blank"
                        textDecorationLine="underline"
                        color={'$primary'}
                        $theme-light={{ color: '$color12' }}
                      >
                        Terms
                      </Anchor>
                    </Label>
                  </XStack>
                  {validationError && (
                    <Paragraph color={'$error'}>{validationError.message}</Paragraph>
                  )}
                </FadeCard>
              )
            }}
          </SchemaForm>
        </YStack>
        <YStack w={'100%'} ai={'center'} gap={'$3.5'}>
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
            pb={'$3.5'}
          >
            <Button.Text
              color={'$primary'}
              $theme-light={{
                color: '$color12',
              }}
              ta={'center'}
            >
              Don&apos;t see your passkey? Try login with phone number
            </Button.Text>
          </LinkableButton>
        </YStack>
      </FormProvider>
    </YStack>
  )
}
