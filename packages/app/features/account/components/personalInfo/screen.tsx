import {
  FadeCard,
  isWeb,
  Paragraph,
  Separator,
  SubmitButton,
  useToastController,
  YStack,
} from '@my/ui'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import type { z } from 'zod'
import { FormProvider, useForm } from 'react-hook-form'
import { VerifyCode } from 'app/features/auth/components/VerifyCode'
import { AuthUserSchema, useAuthUserMutation } from 'app/utils/useAuthUserMutation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProfileMutation } from 'app/utils/useUserPersonalDataMutation'
import { useQuery } from '@tanstack/react-query'
import { adjustUTCDateForTimezone } from 'app/utils/dateHelper'
import { SettingsHeader } from 'app/features/account/components/SettingsHeader'
import { FieldWithLabel } from 'app/features/account/components/FieldWithLabel'
import { ReadOnlyFieldWithLabel } from 'app/features/account/components/ReadOnlyFieldWithLabel'
import { Platform } from 'react-native'

enum FormState {
  Overview = 'Overview',
  PersonalInfoForm = 'PersonalInfoForm',
  VerificationCode = 'VerificationCode',
}

export const PersonalInfoScreen = () => {
  const { profile, session } = useUser()
  const { data: user } = useQuery({
    queryKey: ['user'],
    enabled: !!session?.user,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser()

      if (error) {
        await supabase.auth.signOut()
        throw new Error(error.message)
      }

      return data.user
    },
  })
  const supabase = useSupabase()
  const toast = useToastController()
  const form = useForm<z.infer<typeof AuthUserSchema>>() // Using react-hook-form
  const { mutateAsync: mutateAuthAsync } = useAuthUserMutation()
  const { mutateAsync: mutateProfileAsync } = useProfileMutation()
  const [formState, setFormState] = useState<FormState>(FormState.Overview)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSuccessCodeVerification() {
    setFormState(FormState.Overview)
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
      } else {
        setFormState(FormState.Overview)
      }
    } catch (error) {
      console.error(error)

      if (error?.message) {
        setErrorMessage(error.message)
      }
    }
  }

  const birthday = useMemo(
    () => (profile?.birthday ? adjustUTCDateForTimezone(new Date(profile.birthday)) : undefined),
    [profile?.birthday]
  )

  const formatDate = (date?: Date) =>
    date?.toLocaleString(undefined, { day: 'numeric', month: 'long' }) || ''

  useEffect(() => {
    form.reset({
      phone: user?.phone ?? '',
      birthday,
    })
  }, [user?.phone, form.reset, birthday])

  const verificationCode = (
    <FadeCard>
      <VerifyCode
        type={'phone_change'}
        phone={form.getValues().phone}
        onSuccess={handleSuccessCodeVerification}
      />
    </FadeCard>
  )

  const renderAfterContent = useCallback(
    ({ submit }: { submit: () => void }) => (
      <YStack>
        <SubmitButton onPress={() => submit()}>
          <SubmitButton.Text>SAVE CHANGES</SubmitButton.Text>
        </SubmitButton>
        {errorMessage && (
          <Paragraph marginTop={'$5'} theme="red" color="$color9">
            {errorMessage}
          </Paragraph>
        )}
      </YStack>
    ),
    [errorMessage]
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
        },
        birthday: {
          'aria-label': 'birthday',
          bc: '$color0',
          customDateFormatter: formatDate,
          disabled: Boolean(profile?.birthday),
        },
      }}
      formProps={{
        footerProps: { p: 0 },
        $gtSm: {
          maxWidth: '100%',
        },
      }}
      renderAfter={renderAfterContent}
    >
      {({ birthday }) => (
        <FadeCard elevation={'$0.75'}>
          <FieldWithLabel label={'Date of Birth'} additionalInfo={'(non-editable)'} gap={'$2'}>
            {birthday}
          </FieldWithLabel>
        </FadeCard>
      )}
    </SchemaForm>
  )

  const overview = (
    <YStack gap={'$5'}>
      <FadeCard>
        <ReadOnlyFieldWithLabel
          label={'Date of Birth'}
          text={formatDate(birthday) || '-'}
          additionalInfo={'(non-editable)'}
        />
      </FadeCard>
      <SubmitButton onPress={() => setFormState(FormState.PersonalInfoForm)}>
        <SubmitButton.Text>edit personal information</SubmitButton.Text>
      </SubmitButton>
    </YStack>
  )

  return (
    <YStack w={'100%'}>
      <YStack gap={'$3.5'}>
        {Platform.OS === 'web' && <SettingsHeader>Personal Information</SettingsHeader>}
        <FormProvider {...form}>
          {(() => {
            switch (formState) {
              case FormState.Overview:
                return overview
              case FormState.PersonalInfoForm:
                return personalInfoForm
              case FormState.VerificationCode:
                return verificationCode
              default:
                return overview
            }
          })()}
        </FormProvider>
      </YStack>
    </YStack>
  )
}
