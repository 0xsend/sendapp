import { FormWrapper, H2, H4, Paragraph, SubmitButton, Theme, YStack, XStack } from '@my/ui'
import { MobileOtpType } from '@supabase/supabase-js'
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
          },
        }}
        renderAfter={({ submit }) => (
          <>
            <Theme inverse>
              <XStack jc={'space-between'} ai={'center'}>
                <SubmitButton
                  onPress={() => submit()}
                  borderRadius="$4"
                  backgroundColor={'#C3AB8E'}
                  width={'$12'}
                  $sm={{ width: '$10' }}
                >
                  <Paragraph
                    size={'$1'}
                    textAlign={'center'}
                    fontWeight={'700'}
                    padding={'unset'}
                    margin={'unset'}
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
              <H4 $sm={{ size: '$8' }}>Confirm</H4>
              <Paragraph theme="alt1" size={'$1'}>
                Enter the code we sent you
              </Paragraph>
            </YStack>
            <Paragraph size={'$1'} fontWeight={'500'}>
              Your Code
            </Paragraph>
            {Object.values(fields)}
          </>
        )}
      </SchemaForm>
    </FormWrapper>
  )
}
