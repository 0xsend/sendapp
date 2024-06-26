import {
  ButtonText,
  BigHeading,
  Paragraph,
  SubmitButton,
  XStack,
  YStack,
  H3,
  Anchor,
  type AnchorProps,
} from '@my/ui'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { FormProvider, useForm } from 'react-hook-form'
import { api } from 'app/utils/api'
import { useRouter } from 'solito/router'
import { VerifyCode } from 'app/features/auth/components/VerifyCode'
import { z } from 'zod'
import { useState } from 'react'
import AccountRecovery from 'app/features/auth/account-recovery/account-recovery'

const SignInSchema = z.object({
  countrycode: formFields.countrycode,
  phone: formFields.text.min(1).max(20),
})
export const SignInForm = () => {
  const [showRecoveryForm, setShowRecoveryForm] = useState<boolean>(false)
  const form = useForm<z.infer<typeof SignInSchema>>()
  const signInWithOtp = api.auth.signInWithOtp.useMutation()

  const router = useRouter()

  async function signInWithPhone({ phone, countrycode }: z.infer<typeof SignInSchema>) {
    const { error } = await signInWithOtp
      .mutateAsync({
        phone,
        countrycode,
      })
      .catch((e) => {
        console.error("Couldn't send OTP", e)
        return { error: { message: 'Something went wrong' } }
      })

    if (error) {
      const errorMessage = error.message.toLowerCase()
      form.setError('phone', { type: 'custom', message: errorMessage })
    } else {
      // form state is successfully submitted, show the code input
    }
  }
  return (
    <FormProvider {...form}>
      {(() => {
        switch (true) {
          case showRecoveryForm:
            return <AccountRecovery onClose={() => setShowRecoveryForm(false)} />
          case form.formState.isSubmitSuccessful: // form submission requests OTP code for verification
            return (
              <VerifyCode
                phone={`${form.getValues().countrycode}${form.getValues().phone}`}
                onSuccess={() => {
                  router.push('/')
                }}
              />
            )
          default:
            return (
              <SchemaForm
                flex={1}
                form={form}
                schema={SignInSchema}
                onSubmit={signInWithPhone}
                defaultValues={{ phone: '', countrycode: '' }}
                props={{
                  countrycode: {
                    // @ts-expect-error unsure how to get web props to work with tamagui
                    'aria-label': 'Country Code',
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
                  <XStack
                    f={1}
                    mt={'0'}
                    jc={'space-between'}
                    $sm={{ jc: 'center', height: '100%' }}
                    ai={'center'}
                  >
                    <ForgotPhoneNumberLink
                      display="none"
                      $gtMd={{ display: 'block' }}
                      onPress={(e) => {
                        e.preventDefault()
                        setShowRecoveryForm(true)
                      }}
                    />
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
                        {'/SEND IT'}
                      </ButtonText>
                    </SubmitButton>
                  </XStack>
                )}
              >
                {({ countrycode: CountryCode, phone: Phone }) => (
                  <YStack gap="$5" jc="center" $sm={{ f: 1 }}>
                    <BigHeading color="$color12">WELCOME TO SEND</BigHeading>
                    <H3
                      lineHeight={28}
                      $platform-web={{ fontFamily: '$mono' }}
                      $theme-light={{ col: '$gray10Light' }}
                      $theme-dark={{ col: '$olive' }}
                      fontWeight={'300'}
                      $sm={{ size: '$5' }}
                    >
                      Sign up or Sign in with your phone number.
                    </H3>

                    <YStack gap="$4">
                      <Paragraph color="$color12" size={'$1'} fontWeight={'500'}>
                        Your Phone
                      </Paragraph>
                      <XStack gap="$5">
                        {CountryCode}
                        {Phone}
                      </XStack>
                      <ForgotPhoneNumberLink
                        $gtMd={{ display: 'none' }}
                        onPress={(e) => {
                          e.preventDefault()
                          setShowRecoveryForm(true)
                        }}
                      />
                    </YStack>
                  </YStack>
                )}
              </SchemaForm>
            )
        }
      })()}
    </FormProvider>
  )
}

const ForgotPhoneNumberLink = (props: AnchorProps) => (
  <Anchor href="" fontSize="$3" {...props}>
    Forgot your phone number?
  </Anchor>
)
