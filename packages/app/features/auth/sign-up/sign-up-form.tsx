import { Turnstile } from '@marsidev/react-turnstile'
import { Anchor, BigHeading, ButtonText, H3, Paragraph, SubmitButton, XStack, YStack } from '@my/ui'
import { TRPCClientError } from '@trpc/client'
import { VerifyCode } from 'app/features/auth/components/VerifyCode'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { api } from 'app/utils/api'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useLink } from 'solito/link'
import { useRouter } from 'solito/router'
import { z } from 'zod'

const SignUpSchema = z.object({
  countrycode: formFields.countrycode,
  phone: formFields.text.min(1).max(20),
})

export const SignUpForm = () => {
  const form = useForm<z.infer<typeof SignUpSchema>>()
  const signInWithOtp = api.auth.signInWithOtp.useMutation()
  const router = useRouter()
  const [captchaToken, setCaptchaToken] = useState<string | undefined>()
  const signInLink = useLink({ href: '/auth/sign-in' })

  async function signUpWithPhone({ phone, countrycode }: z.infer<typeof SignUpSchema>) {
    const { error } = await signInWithOtp
      .mutateAsync({
        phone,
        countrycode,
        captchaToken,
      })
      .catch((e) => {
        console.error("Couldn't send OTP", e)
        if (e instanceof TRPCClientError) {
          return { error: { message: e.message } }
        }
        return { error: { message: e.message } }
      })

    if (error) {
      const errorMessage = error.message.toLowerCase()
      form.setError('phone', { type: 'custom', message: errorMessage })
    }
  }

  return (
    <FormProvider {...form}>
      {form.formState.isSubmitSuccessful ? (
        <VerifyCode
          phone={`${form.getValues().countrycode}${form.getValues().phone}`}
          onSuccess={() => {
            router.push('/')
          }}
        />
      ) : (
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
                  <ButtonText
                    size={'$2'}
                    padding={'unset'}
                    ta="center"
                    margin={'unset'}
                    col="black"
                  >
                    {'/SIGN UP'}
                  </ButtonText>
                </SubmitButton>
              </XStack>
              <XStack jc="center" ai="center" mt="$4">
                <Paragraph size="$2" color="$color11">
                  Already have an account?{' '}
                  <Anchor color="$color12" {...signInLink}>
                    Sign in
                  </Anchor>
                </Paragraph>
              </XStack>
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
      )}
    </FormProvider>
  )
}
