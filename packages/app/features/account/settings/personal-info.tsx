import {
  Button,
  isWeb,
  Paragraph,
  Separator,
  SubmitButton,
  Text,
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
import { useEffect, useMemo, useState } from 'react'
import { useProfileMutation } from 'app/utils/useUserPersonalDataMutation'
import { useQuery } from '@tanstack/react-query'
import { adjustUTCDateForTimezone } from 'app/utils/dateHelper'
import { SettingsHeader } from 'app/features/account/settings/components/SettingsHeader'
import { FieldWithLabel } from 'app/features/account/settings/components/FieldWithLabel'
import { ReadOnlyFieldWithLabel } from 'app/features/account/settings/components/ReadOnlyFieldWithLabel'
import { Section } from 'app/components/layout/Section'

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
      xUsername: profile?.x_username ?? '',
      birthday,
    })
  }, [profile?.x_username, user?.phone, form.reset, birthday])

  const verificationCode = (
    <Section>
      <VerifyCode
        type={'phone_change'}
        phone={form.getValues().phone}
        onSuccess={handleSuccessCodeVerification}
      />
    </Section>
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
        xUsername: {
          'aria-label': 'X username',
          bc: '$color0',
          pl: '$8',
          iconBefore: (
            <Text color="$color10" userSelect={'none'} lineHeight={8}>
              @
            </Text>
          ),
        },
        birthday: {
          'aria-label': 'birthday',
          bc: '$color0',
          customDateFormatter: formatDate,
          disabled: Boolean(profile?.birthday),
        },
      }}
      renderAfter={({ submit }) => (
        <YStack>
          <SubmitButton
            theme="green"
            borderRadius={'$4'}
            p={'$4'}
            mt={'$1'}
            onPress={() => submit()}
          >
            <Button.Text
              ff={'$mono'}
              fontWeight={'500'}
              tt="uppercase"
              size={'$5'}
              color={'$black'}
            >
              SAVE CHANGES
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
      {({ phone, birthday, xUsername }) => (
        <Section>
          <FieldWithLabel label={'Phone'} gap={'$2'}>
            {phone}
          </FieldWithLabel>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          <FieldWithLabel label={'Date of Birth'} additionalInfo={'(non-editable)'} gap={'$2'}>
            {birthday}
          </FieldWithLabel>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          <FieldWithLabel label={'X Handle'} gap={'$2'}>
            {xUsername}
          </FieldWithLabel>
        </Section>
      )}
    </SchemaForm>
  )

  const overview = (
    <YStack gap={'$5'}>
      <Section>
        <ReadOnlyFieldWithLabel label={'Phone'} text={user?.phone || '-'} />
        <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
        <ReadOnlyFieldWithLabel
          label={'Date of Birth'}
          text={formatDate(birthday) || '-'}
          additionalInfo={'(non-editable)'}
        />
        <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
        <ReadOnlyFieldWithLabel
          label={'X Handle'}
          text={profile?.x_username ? `@ ${profile?.x_username}` : '-'}
        />
      </Section>
      <SubmitButton
        theme="green"
        borderRadius={'$4'}
        p={'$4'}
        onPress={() => setFormState(FormState.PersonalInfoForm)}
      >
        <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'} color={'$black'}>
          edit personal information
        </Button.Text>
      </SubmitButton>
    </YStack>
  )

  return (
    <YStack w={'100%'}>
      <YStack gap={'$3.5'}>
        <SettingsHeader>Personal Information</SettingsHeader>
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
