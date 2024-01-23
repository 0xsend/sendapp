import {
  Fieldset,
  H2,
  Input,
  Label,
  SubmitButton,
  Theme,
  YStack,
  isWeb,
  useToastController,
  XStack,
  Button,
  Paragraph,
  Container,
} from '@my/ui'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { useRouter } from 'solito/router'
import { z } from 'zod'
import { FormProvider, useForm } from 'react-hook-form'
import { VerifyCode } from 'app/features/auth/components/VerifyCode'
import { useThemeSetting } from '@tamagui/next-theme'

const ChangePhoneSchema = z.object({
  phone: formFields.text.describe('New phone number'),
})

export const ChangePhoneScreen = () => {
  const { user } = useUser()
  const supabase = useSupabase()
  const toast = useToastController()
  const router = useRouter()
  const form = useForm<z.infer<typeof ChangePhoneSchema>>() // Using react-hook-form
  const { resolvedTheme } = useThemeSetting()

  const handleChangePhone = async ({ phone }: z.infer<typeof ChangePhoneSchema>) => {
    const { error } = await supabase.auth.updateUser({ phone }) // Assume this function sends a code
    if (error) {
      form.setError('phone', { type: 'custom', message: error.message })
    } else {
      toast.show('Check your phone', {
        message: `We sent you a confirmation code to ${phone}.`,
      })
    }
  }
  return (
    <Container>
      <YStack w={'100%'} ai={'center'}>
        <XStack w={'100%'} jc={'space-between'} marginHorizontal={'5%'}>
          <Paragraph size={'$9'} fontWeight={'700'}>
            Change Phone No
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
                schema={ChangePhoneSchema}
                onSubmit={handleChangePhone}
                props={{
                  phone: {
                    'aria-label': 'Phone number',
                    borderWidth: 1,
                  },
                }}
                defaultValues={{
                  phone: '',
                }}
                renderAfter={({ submit }) => (
                  <XStack
                    jc={'space-between'}
                    ai={'center'}
                    $lg={{ flexDirection: 'column' }}
                    $gtLg={{ flexDirection: 'row' }}
                  >
                    <Button f={1} marginTop={'$5'} onPress={() => submit()}>
                      Update Phone
                    </Button>
                  </XStack>
                )}
              >
                {(fields) => (
                  <>
                    <Fieldset>
                      <Label size="$3" htmlFor="current-phone">
                        Current Phone
                      </Label>
                      <Input
                        disabled
                        opacity={0.8}
                        cursor="not-allowed"
                        id="current-phone"
                        autoComplete="tel"
                        value={user?.phone}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        backgroundColor={resolvedTheme?.startsWith('dark') ? 'black' : 'white'}
                      />
                    </Fieldset>
                    {Object.values(fields)}
                  </>
                )}
              </SchemaForm>
            )}
          </FormProvider>
        </XStack>
      </YStack>
    </Container>
  )
}
