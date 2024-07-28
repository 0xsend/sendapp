import {
  BigHeading,
  ButtonText,
  FormWrapper,
  H3,
  Paragraph,
  SubmitButton,
  XStack,
  YStack,
} from '@my/ui'
import type { MobileOtpType, Session, User } from '@supabase/supabase-js'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const ConfirmSchema = z.object({
  token: formFields.text,
})

export type VerifyCodeProps = {
  phone: string
  onSuccess: (data?: {
    user: User | null
    session: Session | null
  }) => void
  type?: MobileOtpType
}

export const VerifyCode = ({ phone, onSuccess, type = 'sms' }: VerifyCodeProps) => {
  const supabase = useSupabase()
  const form = useForm<z.infer<typeof ConfirmSchema>>()
  async function confirmCode({ token }: z.infer<typeof ConfirmSchema>) {
    const { error, data } = await supabase.auth.verifyOtp({
      phone,
      token,
      type,
    })

    if (error) {
      const errorMessage = error?.message.toLowerCase()
      form.setError('token', { type: 'custom', message: errorMessage })
    } else {
      onSuccess(data)
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
            '$theme-dark': {
              borderBottomColor: '$green10Dark',
            },
            '$theme-light': {
              borderBottomColor: '$green9Light',
            },

            borderWidth: 0,
            borderBottomWidth: 2,
            borderRadius: '$0',
            width: '100%',
            backgroundColor: 'transparent',
            color: '$color12',
            fontFamily: '$mono',
            fontVariant: ['tabular-nums'],
            fontWeight: '400',
            fontSize: '$7',
            $sm: {
              w: '60%',
            },
            // @todo move these to OTP form when that becomes stable
            textContentType: 'oneTimeCode',
            autoComplete: 'one-time-code',
            outlineColor: 'transparent',
            theme: 'green',
            autoFocus: true,
            fieldsetProps: {
              f: 1,
            },
            focusStyle: {
              borderBottomColor: '$green3Light',
            },
          },
        }}
        renderAfter={({ submit }) => (
          <XStack
            f={1}
            mt={'0'}
            jc={'space-between'}
            $sm={{ jc: 'center', height: '100%' }}
            ai={'center'}
          >
            <SubmitButton
              onPress={() => submit()}
              br="$3"
              bc={'$green9Light'}
              $sm={{ w: '100%' }}
              $gtMd={{
                mt: '0',
                als: 'flex-end',
                mx: 0,
                ml: 'auto',
                w: '$10.5',
                h: '$3.5',
              }}
            >
              <ButtonText size={'$1'} padding={'unset'} ta="center" margin={'unset'} col="black">
                {'VERIFY ACCOUNT'}
              </ButtonText>
            </SubmitButton>
          </XStack>
        )}
      >
        {({ token }) => (
          <YStack gap="$5" jc="center" $sm={{ f: 1 }}>
            <BigHeading color="$color12">VERIFY ACCOUNT</BigHeading>
            <H3
              lineHeight={28}
              $platform-web={{ fontFamily: '$mono' }}
              $theme-light={{ col: '$gray10Light' }}
              $theme-dark={{ col: '$olive' }}
              fontWeight={'300'}
              $sm={{ size: '$5' }}
            >
              Enter verification code
            </H3>
            <YStack gap="$4">
              <Paragraph color="$color12" size={'$1'} fontWeight={'500'}>
                Your Code
              </Paragraph>
              {token}
            </YStack>
          </YStack>
        )}
      </SchemaForm>
    </FormWrapper>
  )
}
