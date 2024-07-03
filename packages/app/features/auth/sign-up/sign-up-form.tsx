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

const SignUpSchema = z.object({
  countrycode: formFields.countrycode,
  phone: formFields.text.min(1).max(20),
})

export const SignUpForm = () => {
  const form = useForm<z.infer<typeof SignUpSchema>>()
  const signInWithOtp = api.auth.signInWithOtp.useMutation()
  const router = useRouter()

  async function signUpWithPhone({ phone, countrycode }: z.infer<typeof SignUpSchema>) {
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
                <ButtonText size={'$2'} padding={'unset'} ta="center" margin={'unset'} col="black">
                  {'/SIGN UP'}
                </ButtonText>
              </SubmitButton>
            </XStack>
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
