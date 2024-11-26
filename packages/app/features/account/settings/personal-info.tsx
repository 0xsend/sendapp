import {
  Button,
  isWeb,
  Paragraph,
  SubmitButton,
  Text,
  useToastController,
  XStack,
  YStack,
} from '@my/ui'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import type { z } from 'zod'
import { FormProvider, useForm } from 'react-hook-form'
import { VerifyCode } from 'app/features/auth/components/VerifyCode'
import { AuthUserSchema, useAuthUserMutation } from 'app/utils/useAuthUserMutation'
import { useEffect, useState } from 'react'
import { useProfileMutation } from 'app/utils/useUserPersonalDataMutation'

enum FormState {
  PersonalInfoForm = 'PersonalInfoForm',
  VerificationCode = 'VerificationCode',
}

export const PersonalInfoScreen = () => {
  const { user, profile } = useUser()
  const supabase = useSupabase()
  const toast = useToastController()
  const form = useForm<z.infer<typeof AuthUserSchema>>() // Using react-hook-form
  const { mutateAsync: mutateAuthAsync } = useAuthUserMutation()
  const { mutateAsync: mutateProfileAsync } = useProfileMutation()
  const [formState, setFormState] = useState<FormState>(FormState.PersonalInfoForm)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSuccessCodeVerification() {
    setFormState(FormState.PersonalInfoForm)
    toast.show('Phone number updated')

    if (!isWeb) {
      await supabase.auth.refreshSession()
    }
  }

  async function handleUserUpdate() {
    const values = form.getValues()
    setFormState(FormState.VerificationCode)
    await mutateAuthAsync(values)
  }

  async function handleSubmit() {
    setErrorMessage(null)
    const values = form.getValues()
    const shouldUpdateUser = user?.phone !== values.phone

    try {
      await mutateProfileAsync(values)

      if (shouldUpdateUser) {
        await handleUserUpdate()
      }
    } catch (error) {
      console.error(error)

      if (error?.message) {
        setErrorMessage(error.message)
      }
    }
  }

  useEffect(() => {
    form.reset({ phone: user?.phone ?? '', xUsername: profile?.x_username ?? '' })
  }, [profile?.x_username, user?.phone, form.reset])

  const verificationCode = (
    <VerifyCode
      type={'phone_change'}
      phone={form.getValues().phone}
      onSuccess={handleSuccessCodeVerification}
    />
  )

  const personalInfoForm = (
    <SchemaForm
      form={form}
      schema={AuthUserSchema}
      onSubmit={handleSubmit}
      props={{
        phone: {
          'aria-label': 'Phone number',
          autoComplete: 'tel',
          keyboardType: 'phone-pad',
          autoCapitalize: 'none',
          bc: '$color0',
          labelProps: {
            color: '$color10',
          },
        },
        xUsername: {
          'aria-label': 'X username',
          labelProps: {
            color: '$color10',
          },
          bc: '$color0',
          pl: '$8',
          iconBefore: (
            <Text color="$color10" userSelect={'none'} lineHeight={8}>
              @
            </Text>
          ),
        },
      }}
      renderAfter={({ submit }) => (
        <YStack ai={'flex-start'}>
          <SubmitButton
            f={1}
            marginTop={'$5'}
            fontWeight={'500'}
            onPress={() => submit()}
            theme="green"
            borderRadius={'$3'}
            px={'$size.1.5'}
          >
            <Button.Text ff={'$mono'} fontWeight={'600'} tt="uppercase" size={'$5'}>
              SAVE
            </Button.Text>
          </SubmitButton>
          {errorMessage && (
            <Paragraph marginTop={'$5'} theme="red" color="$color9">
              {errorMessage}
            </Paragraph>
          )}
        </YStack>
      )}
    >
      {(fields) => <>{Object.values(fields)}</>}
    </SchemaForm>
  )

  return (
    <YStack w={'100%'} als={'center'}>
      <XStack w={'100%'} $gtLg={{ paddingTop: '$6' }} $lg={{ jc: 'center' }}>
        <FormProvider {...form}>
          {(() => {
            switch (formState) {
              case FormState.PersonalInfoForm:
                return personalInfoForm
              case FormState.VerificationCode:
                return verificationCode
            }
          })()}
        </FormProvider>
      </XStack>
    </YStack>
  )
}
