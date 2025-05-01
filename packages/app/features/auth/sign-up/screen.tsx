import {
  Anchor,
  Button,
  FadeCard,
  Label,
  Paragraph,
  Separator,
  SubmitButton,
  useToastController,
  XStack,
  YStack,
} from '@my/ui'
import { useCallback, useEffect, useId, useState } from 'react'
import { Turnstile } from 'app/features/auth/sign-up/Turnstile'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { SendtagSchema } from 'app/utils/zod/sendtag'
import { formFields, SchemaForm } from 'app/utils/SchemaForm'
import { signChallenge } from 'app/utils/signChallenge'
import { bytesToHex, hexToBytes } from 'viem'
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'
import { formatErrorMessage } from 'app/utils/formatErrorMessage'
import { api } from 'app/utils/api'
import { useRouter } from 'solito/router'
import { useAuthScreenParams } from 'app/routers/params'
import { SendtagAvailability } from '@my/api/src/routers/tag/types'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { base16, base64urlnopad } from '@scure/base'
import { asciiToByteArray } from 'app/utils/asciiToByteArray'
import { createPasskey } from 'app/utils/createPasskey'
import { base64URLNoPadToBase16 } from 'app/utils/base64ToBase16'
import { assert } from 'app/utils/assert'
import { useUser } from 'app/utils/useUser'
import { useThemeSetting } from '@tamagui/next-theme'

const SendtagSchemaWithoutRestrictions = z.object({
  name: formFields.text,
  isAgreedToTerms: formFields.boolean_checkbox,
})

enum SignUpFormState {
  Idle = 'Idle',
  PasskeyCreationFailed = 'PasskeyCreationFailed',
}

export const SignUpScreen = () => {
  const [captchaToken, setCaptchaToken] = useState<string | undefined>()
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false)
  const [signUpFormState, setSignUpFormState] = useState<SignUpFormState>(SignUpFormState.Idle)
  const form = useForm<z.infer<typeof SendtagSchemaWithoutRestrictions>>()
  const router = useRouter()
  const [queryParams] = useAuthScreenParams()
  const { redirectUri } = queryParams
  const toast = useToastController()
  const sendAccount = useSendAccount()
  const supabase = useSupabase()
  const { user } = useUser()
  const termsCheckboxId = useId()
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')

  const formName = form.watch('name')
  const formIsAgreedToTerms = form.watch('isAgreedToTerms')
  const validationError = form.formState.errors.root
  const canSubmit =
    signUpFormState === SignUpFormState.PasskeyCreationFailed ||
    (!!formName && !validationError && formIsAgreedToTerms)

  const { refetch: refetchCheckSendtagAvailability } = api.tag.checkAvailability.useQuery(
    { name: formName },
    { enabled: false }
  )

  const { mutateAsync: signUpMutateAsync } = api.auth.signUp.useMutation({
    retry: false,
  })

  const { mutateAsync: getChallengeMutateAsync } = api.challenge.getChallenge.useMutation({
    retry: false,
  })

  const { mutateAsync: validateSignatureMutateAsync } = api.challenge.validateSignature.useMutation(
    { retry: false }
  )

  const { mutateAsync: sendAccountCreateMutateAsync } = api.sendAccount.create.useMutation()

  const { mutateAsync: registerFirstSendtagMutateAsync } =
    api.tag.registerFirstSendtag.useMutation()

  useEffect(() => {
    const subscription = form.watch(() => {
      form.clearErrors('root')
    })

    return () => subscription.unsubscribe()
  }, [form.watch, form.clearErrors])

  useEffect(() => {
    if (user?.id) {
      router.replace('/auth/onboarding')
    }
  }, [user?.id, router.replace])

  // TODO reause
  const createSendAccount = async () => {
    const { data: sessionData } = await supabase.auth.getSession()

    assert(!!sessionData?.session?.user?.id, 'No user id')

    const { data: sendAcct, error: refetchError } = await sendAccount.refetch()
    if (refetchError) throw refetchError
    if (sendAcct) {
      throw new Error(`Account already created: ${sendAcct.address}`)
    }

    const accountName = formName
    const keySlot = 0
    const passkeyName = `${sessionData.session.user.id}.${keySlot}` // 64 bytes max
    const challenge = base64urlnopad.encode(asciiToByteArray('foobar'))

    const [rawCred, authData] = await createPasskey({
      user: sessionData.session.user,
      keySlot,
      challenge,
      accountName,
    })

    const raw_credential_id = base64URLNoPadToBase16(rawCred.rawId)
    const attestation_object = base64URLNoPadToBase16(rawCred.response.attestationObject)

    await sendAccountCreateMutateAsync({
      accountName,
      passkeyName,
      rawCredentialIDB16: raw_credential_id,
      cosePublicKeyB16: base16.encode(authData.COSEPublicKey),
      rawAttestationObjectB16: attestation_object,
      keySlot,
    })

    const { data: sendAcct2, error: refetchError2 } = await sendAccount.refetch()
    if (refetchError2) throw refetchError
    if (sendAcct2) {
      return
    }

    throw new Error('Account not created. Please try again.')
  }

  const validateSendtag = async (name: string) => {
    const { error: schemaError } = SendtagSchema.safeParse({ name })

    if (schemaError) {
      throw new Error(schemaError.errors[0]?.message ?? 'Invalid Sendtag')
    }

    const { data: checkSendtagAvailabilityResponse, error: checkSendtagAvailabilityError } =
      await refetchCheckSendtagAvailability()

    if (checkSendtagAvailabilityError) {
      throw new Error(
        checkSendtagAvailabilityError.message ?? 'Error checking sendtag availability'
      )
    }

    if (
      checkSendtagAvailabilityResponse &&
      checkSendtagAvailabilityResponse.sendtagAvailability === SendtagAvailability.Taken
    ) {
      throw new Error('This Sendtag is already taken')
    }
  }

  const handleSubmit = async ({ name }: z.infer<typeof SendtagSchemaWithoutRestrictions>) => {
    try {
      if (signUpFormState !== SignUpFormState.PasskeyCreationFailed) {
        await validateSendtag(name)

        await signUpMutateAsync({
          sendtag: name,
          captchaToken,
        })
      }

      await createSendAccount().catch((error) => {
        setSignUpFormState(SignUpFormState.PasskeyCreationFailed)
        throw error
      })

      await registerFirstSendtagMutateAsync({ name })
    } catch (error) {
      form.setError('root', {
        type: 'custom',
        message: error.message,
      })
      return
    }

    // TODO register upstream

    router.replace('/')
  }

  const handleSignIn = useCallback(async () => {
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
      toast.show(formatErrorMessage(error), {
        preset: 'error',
        isUrgent: true,
        duration: 10000000,
      })
    } finally {
      setIsSigningIn(false)
    }
  }, [getChallengeMutateAsync, router, redirectUri, validateSignatureMutateAsync, toast.show])

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <SubmitButton
        alignSelf={'center'}
        w={'90%'}
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
          {signUpFormState === SignUpFormState.PasskeyCreationFailed
            ? 'create passkey'
            : 'create account'}
        </Button.Text>
      </SubmitButton>
    ),
    [canSubmit, signUpFormState]
  )

  return (
    <YStack f={1} jc={'space-around'} ai={'center'} gap={'$3.5'} py={'$3.5'}>
      <FormProvider {...form}>
        <YStack w={'100%'} ai={'center'}>
          <Paragraph w={'90%'} size={'$8'} fontWeight={500} tt={'uppercase'}>
            create your account
          </Paragraph>
          <Paragraph w={'90%'} size={'$5'} color={'$olive'}>
            Sendtags are usernames
          </Paragraph>
          <SchemaForm
            form={form}
            onSubmit={handleSubmit}
            schema={SendtagSchemaWithoutRestrictions}
            defaultValues={{
              name: '',
              isAgreedToTerms: false,
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
                disabled: signUpFormState === SignUpFormState.PasskeyCreationFailed,
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
                disabled: signUpFormState === SignUpFormState.PasskeyCreationFailed,
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
                  my={'$5'}
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
                  {validationError && (
                    <Paragraph color={'$error'}>{validationError.message}</Paragraph>
                  )}
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
                </FadeCard>
              )
            }}
          </SchemaForm>
        </YStack>
        <YStack w={'100%'} gap={'$3.5'}>
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
            p={'$3'}
            disabled={isSigningIn}
          >
            <Button.Text
              color={'$primary'}
              $theme-light={{
                color: '$color12',
              }}
            >
              {isSigningIn ? 'Signing in...' : 'Sign in'}
            </Button.Text>
          </Button>
        </YStack>
        <Turnstile onSuccess={(t) => setCaptchaToken(t)} />
        <Button
          onPress={() => {
            // TODO
          }}
          transparent
          chromeless
          backgroundColor="transparent"
          hoverStyle={{ backgroundColor: 'transparent' }}
          pressStyle={{ backgroundColor: 'transparent' }}
          focusStyle={{ backgroundColor: 'transparent' }}
          bw={0}
          br={0}
          height={'auto'}
          p={'$3'}
        >
          <Button.Text
            color={'$primary'}
            $theme-light={{
              color: '$color12',
            }}
            tt={'uppercase'}
          >
            create a backup
          </Button.Text>
        </Button>
      </FormProvider>
    </YStack>
  )
}
