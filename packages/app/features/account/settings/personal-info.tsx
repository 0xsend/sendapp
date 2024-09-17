import { SubmitButton, YStack, isWeb, useToastController, XStack, Button, H1 } from '@my/ui'
import { SchemaForm } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { useRouter } from 'solito/router'
import type { z } from 'zod'
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
      <XStack w={'100%'}>
        <H1 size={'$9'} fontWeight={'600'} color="$color12">
          Personal Information
        </H1>
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
                  bc: '$color0',
                  labelProps: {
                    color: '$color10',
                  },
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
