import { ButtonText, BigHeading, Paragraph, SubmitButton, Theme, XStack, YStack, H3 } from '@my/ui'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { FormProvider, useForm } from 'react-hook-form'
import { api } from 'app/utils/api'
import { useRouter } from 'solito/router'
import { VerifyCode } from 'app/features/auth/components/VerifyCode'
import { z } from 'zod'

const SignInSchema = z.object({
  countrycode: formFields.countrycode,
  phone: formFields.text,
})
export const SignInForm = () => {
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
      {form.formState.isSubmitSuccessful ? (
        <VerifyCode
          phone={`${form.getValues().countrycode}${form.getValues().phone}`}
          onSuccess={() => {
            router.push('/')
          }}
        />
      ) : (
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
                borderBottomColor: '$accent9Light',
              },
              '$theme-light': {
                borderBottomColor: '$black',
              },
              fontFamily: '$mono',
              fontVariant: ['tabular-nums'],
              fontSize: '$7',
              borderWidth: 0,
              borderBottomWidth: 2,
              borderRadius: '$0',
              width: '100%',
              backgroundColor: 'transparent',
              outlineColor: 'transparent',
            },
          }}
          renderAfter={({ submit }) => (
            <XStack
              f={1}
              mt={'0'}
              jc={'flex-end'}
              $sm={{ jc: 'center', height: '100%' }}
              ai={'flex-start'}
            >
              <SubmitButton
                onPress={() => submit()}
                br="$3"
                bc={'$accent9Light'}
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
                  {'/SEND IT'}
                </ButtonText>
              </SubmitButton>
            </XStack>
          )}
        >
          {(fields) => (
            <YStack gap="$5" jc="center" $sm={{ f: 1 }}>
              <Theme inverse={true}>
                <BigHeading col="$background">WELCOME TO SEND</BigHeading>
              </Theme>
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
                <Theme inverse={true}>
                  <Paragraph col="$background" size={'$1'} fontWeight={'500'}>
                    Your Phone
                  </Paragraph>
                </Theme>
                <XStack gap="$5">{Object.values(fields)}</XStack>
              </YStack>
            </YStack>
          )}
        </SchemaForm>
      )}
    </FormProvider>
  )
}
