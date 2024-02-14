import { ButtonText, H1, H3, Paragraph, SubmitButton, Theme, XStack, YStack } from '@my/ui'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { FormProvider, useForm } from 'react-hook-form'
import { api } from 'app/utils/api'
import { useRouter } from 'solito/router'
import { VerifyCode } from './components/VerifyCode'
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
              height: '$3',
            },
            phone: {
              'aria-label': 'Phone number',
              borderBottomColor: '$accent9Light',
              borderWidth: 0,
              borderBottomWidth: 2,
              borderRadius: '$0',
              placeholder: 'Phone number',
              width: '100%',
              backgroundColor: 'transparent',
              outlineColor: 'transparent',
            },
          }}
          renderAfter={({ submit }) => (
            <XStack f={1} mt={'0'} jc={'flex-end'} $sm={{ jc: 'center' }} ai={'flex-start'}>
              <SubmitButton
                onPress={() => submit()}
                br="$3"
                bc={'$accent9Light'}
                w={'$12'}
                $sm={{ dsp: form.getValues().phone?.length > 0 ? 'flex' : 'none' }}
              >
                <ButtonText size={'$1'} padding={'unset'} ta="center" margin={'unset'} col="black">
                  {'/SEND IT!'}
                </ButtonText>
              </SubmitButton>
            </XStack>
          )}
        >
          {(fields) => (
            <YStack gap="$5" jc="center" p="$7" f={1}>
              <Theme inverse={true}>
                <H1 col="$background" size="$11">
                  WELCOME TO SEND
                </H1>
              </Theme>
              <H3 fontWeight="normal" theme="active" $sm={{ size: '$4' }}>
                Sign up or Sign in with your phone number
              </H3>
              <YStack gap="$2">
                <Theme inverse={true}>
                  <Paragraph col="$background" size={'$1'} fontWeight={'500'}>
                    Your Phone
                  </Paragraph>
                </Theme>
                <XStack gap="$2">{Object.values(fields)}</XStack>
              </YStack>
            </YStack>
          )}
        </SchemaForm>
      )}
    </FormProvider>
  )
}
