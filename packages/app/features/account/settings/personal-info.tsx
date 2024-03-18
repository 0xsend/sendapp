import {
  Fieldset,
  Input,
  Label,
  SubmitButton,
  YStack,
  isWeb,
  useToastController,
  XStack,
  Paragraph,
} from '@my/ui'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { useRouter } from 'solito/router'
import { z } from 'zod'
import { FormProvider, useForm } from 'react-hook-form'
import { VerifyCode } from 'app/features/auth/components/VerifyCode'
import { AuthUserSchema, useAuthUserMutation } from 'app/utils/useAuthUserMutation'

export const PersonalInfoScreen = () => {
  const { user } = useUser()
  const supabase = useSupabase()
  const toast = useToastController()
  const router = useRouter()
  const form = useForm<z.infer<typeof AuthUserSchema>>() // Using react-hook-form
  const mutation = useAuthUserMutation()

  if (mutation.isError) {
    form.setError('phone', { type: 'custom', message: mutation.error.message })
  }

  return (
    <YStack w={'100%'} als={'center'}>
      <XStack w={'100%'} $lg={{ display: 'none' }}>
        <Paragraph size={'$8'} fontWeight={'300'} color={'$color05'}>
          Personal Information
        </Paragraph>
      </XStack>
      <XStack w={'100%'} $gtLg={{ paddingTop: '$6' }} $lg={{ jc: 'center' }}>
        <FormProvider {...form}>
          {form.formState.isSubmitSuccessful ? (
            <VerifyCode
              type={'phone_change'}
              phone={form.getValues().phone}
              onSuccess={async () => {
                toast.show('Phone number updated')
                router.back()
                if (!isWeb) {
                  await supabase.auth.refreshSession()
                }
              }}
            />
          ) : (
            <SchemaForm
              form={form}
              schema={AuthUserSchema}
              onSubmit={(values) => mutation.mutate(values)}
              props={{
                phone: {
                  'aria-label': 'Phone number',
                  autoComplete: 'tel',
                  keyboardType: 'phone-pad',
                  autoCapitalize: 'none',
                },
                // email: {
                //   'aria-label': 'Email',
                // },
                // address: {
                //   'aria-label': 'Address',
                // },
              }}
              defaultValues={{
                phone: user?.phone ?? '',
                // email: user?.email ?? '',
                // address: '',
              }}
              renderAfter={({ submit }) => (
                <YStack ai={'center'}>
                  <SubmitButton
                    f={1}
                    marginTop={'$5'}
                    px={'$12'}
                    py={'$5'}
                    fontWeight={'500'}
                    onPress={() => submit()}
                  >
                    SAVE
                  </SubmitButton>
                </YStack>
              )}
            >
              {(fields) => <>{Object.values(fields)}</>}
            </SchemaForm>
          )}
        </FormProvider>
      </XStack>
    </YStack>
  )
}
