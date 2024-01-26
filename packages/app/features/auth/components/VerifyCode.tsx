import { FormWrapper, H4, Paragraph, SubmitButton, Theme, XStack, YStack } from '@my/ui'
import { MobileOtpType } from '@supabase/supabase-js'
import { useThemeSetting } from '@tamagui/next-theme'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const ConfirmSchema = z.object({
  token: formFields.text,
})

export type VerifyCodeProps = {
  phone: string
  onSuccess: () => void
  type?: MobileOtpType
}

export const VerifyCode = ({ phone, onSuccess, type = 'sms' }: VerifyCodeProps) => {
  const supabase = useSupabase()
  const { resolvedTheme } = useThemeSetting()
  const form = useForm<z.infer<typeof ConfirmSchema>>()
  async function confirmCode({ token }: z.infer<typeof ConfirmSchema>) {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type,
    })

    if (error) {
      const errorMessage = error?.message.toLowerCase()
      form.setError('token', { type: 'custom', message: errorMessage })
    } else {
      onSuccess()
    }
  }

  return (
    <FormWrapper>
      <SchemaForm
        form={form}
        schema={ConfirmSchema}
        onSubmit={confirmCode}
        defaultValues={{ token: '' }}
        props={{
          token: {
            'aria-label': 'One-time Password',
            placeholder: 'Code',
            borderWidth: 1,
          },
        }}
        renderAfter={({ submit }) => (
          <>
            <Theme inverse>
              <XStack jc={'space-between'} ai={'center'}>
                <SubmitButton
                  onPress={() => submit()}
                  borderRadius="$4"
                  backgroundColor={'$primary'}
                  width={'$12'}
                  $sm={{ width: '$10' }}
                >
                  <Paragraph
                    size={'$1'}
                    textAlign={'center'}
                    fontWeight={'700'}
                    padding={'unset'}
                    margin={'unset'}
                    theme={resolvedTheme?.startsWith('dark') ? 'light' : 'dark'}
                  >
                    {'Verify'}
                  </Paragraph>
                </SubmitButton>
              </XStack>
            </Theme>
          </>
        )}
      >
        {(fields) => (
          <>
            <YStack gap="$3" mb="$5">
              <H4
                $sm={{ size: '$8' }}
                color={resolvedTheme?.startsWith('dark') ? '#FFFFFF' : '#212121'}
              >
                Confirm
              </H4>
              <Paragraph
                theme="alt1"
                size={'$1'}
                color={resolvedTheme?.startsWith('dark') ? '#C3C3C3' : '#676767'}
              >
                Enter the code we sent you
              </Paragraph>
            </YStack>
            <Paragraph
              size={'$1'}
              fontWeight={'500'}
              color={resolvedTheme?.startsWith('dark') ? '#FFFFFF' : '#212121'}
            >
              Your Code
            </Paragraph>
            {Object.values(fields)}
          </>
        )}
      </SchemaForm>
    </FormWrapper>
  )
}
