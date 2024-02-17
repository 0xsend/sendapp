import {
  ButtonText,
  FormWrapper,
  H1,
  H3,
  Paragraph,
  SubmitButton,
  Theme,
  XStack,
  YStack,
} from '@my/ui'
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
            borderBottomColor: '$accent9Light',
            borderWidth: 0,
            borderBottomWidth: 2,
            borderRadius: '$0',
            placeholder: 'Code',
            width: '100%',
            backgroundColor: 'transparent',
            color: '$background',
            themeInverse: true,
            fontSize: '$6',
            w: '60%',
            outlineColor: 'transparent',
          },
        }}
        renderAfter={({ submit }) => (
          <XStack
            f={1}
            mt={'0'}
            jc={'flex-end'}
            $sm={{ jc: 'center', height: '100%' }}
            ai={'flex-start'}
          >
            <SubmitButton onPress={() => submit()} br="$3" bc={'$accent9Light'} $sm={{ w: '100%' }}>
              <ButtonText size={'$1'} padding={'unset'} ta="center" margin={'unset'} col="black">
                {'VERIFY ACCOUNT'}
              </ButtonText>
            </SubmitButton>
          </XStack>
        )}
      >
        {(fields) => (
          <YStack gap="$5" jc="center" $sm={{ f: 1 }}>
            <Theme inverse={true}>
              <H1 col="$background" size="$11">
                VERIFY ACCOUNT
              </H1>
            </Theme>
            <H3 fontWeight="normal" theme="active" $sm={{ size: '$4' }}>
              Enter the verification code we sent you
            </H3>
            <YStack gap="$2">
              <Theme inverse={true}>
                <Paragraph col="$background" size={'$1'} fontWeight={'500'}>
                  Your Code
                </Paragraph>
              </Theme>
              <XStack gap="$2">{Object.values(fields)}</XStack>
            </YStack>
          </YStack>
        )}
      </SchemaForm>
    </FormWrapper>
  )
}
