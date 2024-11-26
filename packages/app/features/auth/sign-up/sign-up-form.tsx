import { useEffect, useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import {
  BigHeading,
  ButtonText,
  H3,
  Paragraph,
  SubmitButton,
  XStack,
  YStack,
  useToastController,
  Button,
} from '@my/ui'
import { bytesToHex, hexToBytes } from 'viem'
import { useRouter } from 'solito/router'
import { z } from 'zod'
import { FormProvider, useForm } from 'react-hook-form'
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'
import { AuthStatus } from '@my/api/src/routers/auth/types'
import { VerifyCode } from 'app/features/auth/components/VerifyCode'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { api } from 'app/utils/api'
import { formatErrorMessage } from 'app/utils/formatErrorMessage'
import { signChallenge } from 'app/utils/signChallenge'
import { useAuthScreenParams } from 'app/routers/params'

const SignUpSchema = z.object({
  countrycode: formFields.countrycode,
  phone: formFields.text.min(1).max(20),
})

enum PageState {
  SignupForm = 'SignUpForm',
  VerifyCode = 'VerifyCode',
  BackUpPrompt = 'BackUpPrompt',
}

const WEBKIT_CANCEL_PASSKEY_PROMPT_ERROR_NAME = 'NotAllowedError'
const FIREFOX_CANCEL_PASSKEY_PROMPT_ERROR_NAME = 'AbortError'

export const SignUpForm = () => {
  const form = useForm<z.infer<typeof SignUpSchema>>()
  const router = useRouter()
  const [queryParams] = useAuthScreenParams()
  const { redirectUri } = queryParams
  const toast = useToastController()
  const [captchaToken, setCaptchaToken] = useState<string | undefined>()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [pageState, setPageState] = useState(PageState.SignupForm)

  const { mutateAsync: signInWithOtpMutateAsync } = api.auth.signInWithOtp.useMutation({
    retry: false,
  })

  const { mutateAsync: getChallengeMutateAsync } = api.challenge.getChallenge.useMutation({
    retry: false,
  })

  const { mutateAsync: validateSignatureMutateAsync } = api.challenge.validateSignature.useMutation(
    { retry: false }
  )

  const handleSignIn = async (options: { isPhoneAlreadyUsed?: boolean } = {}) => {
    const { isPhoneAlreadyUsed = false } = options

    setIsSigningIn(true)

    try {
      const challengeData = await getChallengeMutateAsync()

      const rawIdsB64: { id: string; userHandle: string }[] = []
      const { encodedWebAuthnSig, accountName, keySlot } = await signChallenge(
        challengeData.challenge as `0x${string}`,
        rawIdsB64
      )

      const encodedWebAuthnSigBytes = hexToBytes(encodedWebAuthnSig)
      const newEncodedWebAuthnSigBytes = new Uint8Array(encodedWebAuthnSigBytes.length + 1)
      newEncodedWebAuthnSigBytes[0] = keySlot
      newEncodedWebAuthnSigBytes.set(encodedWebAuthnSigBytes, 1)

      await validateSignatureMutateAsync({
        recoveryType: RecoveryOptions.WEBAUTHN,
        signature: bytesToHex(newEncodedWebAuthnSigBytes),
        challengeId: challengeData.id,
        identifier: `${accountName}.${keySlot}`,
      })

      router.push(redirectUri ?? '/')
    } catch (error) {
      const wasPasskeyPromptCanceled =
        error.constructor.name === 'DOMException' &&
        (error.name === WEBKIT_CANCEL_PASSKEY_PROMPT_ERROR_NAME ||
          error.name === FIREFOX_CANCEL_PASSKEY_PROMPT_ERROR_NAME)

      if (isPhoneAlreadyUsed && wasPasskeyPromptCanceled) {
        setPageState(PageState.BackUpPrompt)
        return
      }

      toast.show(formatErrorMessage(error), {
        preset: 'error',
        isUrgent: true,
        duration: 10000000,
      })
    } finally {
      setIsSigningIn(false)
    }
  }

  async function signUpWithPhone(
    formData: z.infer<typeof SignUpSchema>,
    options: { bypassOnboardedCheck?: boolean } = {}
  ) {
    const { phone, countrycode } = formData
    const { bypassOnboardedCheck = false } = options

    try {
      const { status } = await signInWithOtpMutateAsync({
        phone,
        countrycode,
        captchaToken,
        bypassOnboardedCheck,
      })

      if (status === AuthStatus.PhoneAlreadyUsed) {
        await handleSignIn({ isPhoneAlreadyUsed: true })
        return
      }

      setPageState(PageState.VerifyCode)
    } catch (error) {
      console.error("Couldn't send OTP", error)
      const errorMessage = error.message.toLowerCase()
      form.setError('phone', { type: 'custom', message: errorMessage })
    }
  }

  function handleBackUpConfirm() {
    const formData = form.getValues()
    void signUpWithPhone(formData, { bypassOnboardedCheck: true })
  }

  function handleBackUpDenial() {
    void handleSignIn({ isPhoneAlreadyUsed: true })
  }

  function handleGoBackFromBackUpPrompt() {
    setPageState(PageState.SignupForm)
  }

  useEffect(() => () => toast.hide(), [toast])

  const verifyCode = (
    <VerifyCode
      phone={`${form.getValues().countrycode}${form.getValues().phone}`}
      onSuccess={() => {
        router.push('/')
      }}
    />
  )

  const signUpForm = (
    <SchemaForm
      form={form}
      schema={SignUpSchema}
      onSubmit={signUpWithPhone}
      defaultValues={{ phone: '', countrycode: '' }}
      formProps={{
        flex: 1,
      }}
      props={{
        countrycode: {
          size: '$3',
        },
        phone: {
          'aria-label': 'Phone number',
          '$theme-dark': {
            borderBottomColor: '$green10Dark',
          },
          '$theme-light': {
            borderBottomColor: '$green9Light',
          },
          fontFamily: '$mono',
          fontVariant: ['tabular-nums'],
          fontSize: '$7',
          fontWeight: '400',
          borderWidth: 0,
          borderBottomWidth: 2,
          borderRadius: '$0',
          width: '100%',
          backgroundColor: 'transparent',
          color: '$color12',
          outlineColor: 'transparent',
          theme: 'green',
          focusStyle: {
            borderBottomColor: '$green3Light',
          },
          fieldsetProps: {
            f: 1,
          },
        },
      }}
      renderAfter={({ submit }) => (
        <YStack jc="center" ai="center" mt="$4">
          <XStack
            f={1}
            mt={'0'}
            jc={'space-between'}
            $sm={{ jc: 'center', height: '100%' }}
            ai={'center'}
          >
            <SubmitButton
              disabled={!captchaToken}
              onPress={() => submit()}
              br="$3"
              bc={'$green9Light'}
              $sm={{ w: '100%' }}
              $gtMd={{
                mt: '0',
                als: 'flex-end',
                mx: 0,
                ml: 'auto',
                w: '$10',
                h: '$3.5',
              }}
            >
              <ButtonText size={'$2'} padding={'unset'} ta="center" margin={'unset'} col="black">
                {'/SIGN UP'}
              </ButtonText>
            </SubmitButton>
          </XStack>
          <YStack pos="relative" pb={'$size.1'} w="100%" maw="$size.22">
            <XStack jc="center" ai="center" mt="$4" gap="$1">
              <Paragraph size="$2" color="$color11">
                Already have an account?
              </Paragraph>
              <SubmitButton onPress={() => handleSignIn()} disabled={isSigningIn} unstyled>
                <ButtonText color="$color11" size="$2" textDecorationLine="underline">
                  {isSigningIn ? 'Signing in...' : 'Sign in'}
                </ButtonText>
              </SubmitButton>
            </XStack>
          </YStack>
          <YStack pt="$4">
            {!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => {
                  setCaptchaToken(token)
                }}
              />
            )}
          </YStack>
        </YStack>
      )}
    >
      {({ countrycode: CountryCode, phone: Phone }) => (
        <YStack gap="$5" jc="center" $sm={{ f: 1 }}>
          <BigHeading color="$color12">CREATE YOUR ACCOUNT</BigHeading>
          <H3
            lineHeight={28}
            $platform-web={{ fontFamily: '$mono' }}
            $theme-light={{ col: '$gray10Light' }}
            $theme-dark={{ col: '$olive' }}
            fontWeight={'300'}
            $sm={{ size: '$5' }}
          >
            Sign up with your phone number.
          </H3>

          <YStack gap="$4">
            <Paragraph color="$color12" size={'$1'} fontWeight={'500'}>
              Your Phone
            </Paragraph>
            <XStack gap="$5">
              {CountryCode}
              {Phone}
            </XStack>
          </YStack>
        </YStack>
      )}
    </SchemaForm>
  )

  const backUpForm = (
    <YStack gap="$5" jc="center" $sm={{ f: 1 }} maw={535}>
      <BigHeading color="$color12">ARE YOU BACKING UP?</BigHeading>
      <H3
        lineHeight={28}
        $platform-web={{ fontFamily: '$mono' }}
        $theme-light={{ col: '$gray10Light' }}
        $theme-dark={{ col: '$olive' }}
        fontWeight={'300'}
        $sm={{ size: '$5' }}
      >
        This number is already associated with an account.
      </H3>
      <XStack gap="$4" mt="$7">
        <SubmitButton size="$4" w="$12" onPress={handleBackUpConfirm}>
          <ButtonText>YES</ButtonText>
        </SubmitButton>
        <Button
          borderColor="$primary"
          $theme-light={{ borderColor: '$color12' }}
          variant="outlined"
          size="$4"
          w="$12"
          onPress={handleBackUpDenial}
        >
          <Button.Text color="$color12">NO</Button.Text>
        </Button>
      </XStack>
      <XStack ai="baseline" gap="$1">
        <SubmitButton onPress={handleGoBackFromBackUpPrompt} unstyled>
          <ButtonText color="$color11" size="$2" textDecorationLine="underline">
            Go back
          </ButtonText>
        </SubmitButton>
        <Paragraph size="$2" color="$color11">
          to sign up form
        </Paragraph>
      </XStack>
    </YStack>
  )

  return (
    <FormProvider {...form}>
      {(() => {
        switch (pageState) {
          case PageState.SignupForm:
            return signUpForm
          case PageState.VerifyCode:
            return verifyCode
          case PageState.BackUpPrompt:
            return backUpForm
        }
      })()}
    </FormProvider>
  )
}
