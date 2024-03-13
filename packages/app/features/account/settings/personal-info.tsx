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
import { PersonalInfoSchema, usePersonalInfoMutation } from 'app/utils/usePersonalInfoMutation'
import { useEffect } from 'react'

export const PersonalInfoScreen = () => {
  const { user } = useUser()
  const supabase = useSupabase()
  const toast = useToastController()
  const router = useRouter()
  const form = useForm<z.infer<typeof PersonalInfoSchema>>() // Using react-hook-form
  const mutation = usePersonalInfoMutation(user?.id)

  if (mutation.isError) {
    form.setError('phone', { type: 'custom', message: mutation.error.message })
  }

  return (
    <YStack w={'100%'} ai={'center'}>
      <XStack w={'100%'} marginHorizontal={'5%'} $md={{ display: 'none' }}>
        <Paragraph size={'$8'} fontWeight={'300'} color={'$color05'}>
          Personal Information
        </Paragraph>
      </XStack>
      <XStack w={'100%'} marginHorizontal={'5%'} paddingTop={'$6'}>
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
              schema={PersonalInfoSchema}
              onSubmit={(values) => mutation.mutate(values)}
              props={{
                phone: {
                  'aria-label': 'Phone number',
                },
                email: {
                  'aria-label': 'Email',
                },
                address: {
                  'aria-label': 'Address',
                },
              }}
              defaultValues={{
                phone: user?.phone ?? '',
                email: user?.email ?? '',
                address: '',
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
              {(fields) => (
                <>
                  {/* <Fieldset>
                      <Label size="$3" htmlFor="current-phone">
                        Current Phone
                      </Label>
                      <Input
                        // disabled
                        opacity={0.8}
                        cursor="not-allowed"
                        id="current-phone"
                        autoComplete="tel"
                        value={user?.phone}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        backgroundColor={resolvedTheme?.startsWith('dark') ? 'black' : 'white'}
                      />
                    </Fieldset> */}
                  {Object.values(fields)}
                </>
              )}
            </SchemaForm>
          )}
        </FormProvider>
      </XStack>
    </YStack>
  )
}
