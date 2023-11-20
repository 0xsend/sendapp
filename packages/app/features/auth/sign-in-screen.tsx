import {
  Card,
  H4,
  Paragraph,
  SendLogo,
  SubmitButton,
  Theme,
  YStack,
  XStack,
  SendLogoComplete,
  SendLogoCompleteLight,
  Anchor,
  SendLogoLight,
} from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { api } from 'app/utils/api'
import React from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { VerifyCode } from './components/VerifyCode'
import { useRouter } from 'solito/router'
import { IconXLogo, IconTelegramLogo } from 'app/components/icons'

const SignInSchema = z.object({
  countrycode: formFields.countrycode,
  phone: formFields.text,
})

export const SignInScreen = () => {
  const form = useForm<z.infer<typeof SignInSchema>>()
  const signInWithOtp = api.auth.signInWithOtp.useMutation()
  const { resolvedTheme } = useThemeSetting()
  const router = useRouter()

  async function signInWithPhone({ phone, countrycode }: z.infer<typeof SignInSchema>) {
    const { error } = await signInWithOtp
      .mutateAsync({
        phone,
        countrycode,
      })
      .catch((e) => {
        console.error("Couldn't send OTP", e)
        return { error: { message: 'Something went wrong' } }
      })

    if (error) {
      const errorMessage = error.message.toLowerCase()
      form.setError('phone', { type: 'custom', message: errorMessage })
    } else {
      // form state is successfully submitted, show the code input
    }
  }

  const calculateMarginBottom = () => {
    return resolvedTheme?.startsWith('dark') ? '$1' : '$15'
  }

  const calculateMarginTop = () => {
    return resolvedTheme?.startsWith('dark') ? '' : '$10'
  }

  const logoTop = () => {
    return resolvedTheme?.startsWith('dark') ? (
      <SendLogo stroke={resolvedTheme?.startsWith('dark') ? 'white' : 'black'} />
    ) : (
      <SendLogoLight stroke={resolvedTheme?.startsWith('dark') ? 'white' : 'black'} />
    )
  }

  const logoBottom = () => {
    return resolvedTheme?.startsWith('dark') ? (
      <SendLogoComplete stroke={resolvedTheme?.startsWith('dark') ? 'white' : 'black'} />
    ) : (
      <SendLogoCompleteLight stroke={resolvedTheme?.startsWith('dark') ? 'white' : 'black'} />
    )
  }

  return (
    <>
      <Card
        bg={resolvedTheme}
        jc={'center'}
        ac={'center'}
        fw={'wrap'}
        pb={calculateMarginBottom()}
        mt={calculateMarginTop()}
        $sm={{
          marginBottom: '',
          paddingBottom: resolvedTheme?.startsWith('dark') ? '' : '$12',
          height: resolvedTheme?.startsWith('dark') ? '$18' : '$12',
        }}
      >
        {logoTop()}
      </Card>
      <FormProvider {...form}>
        {form.formState.isSubmitSuccessful ? (
          <VerifyCode
            phone={`${form.getValues().countrycode}${form.getValues().phone}`}
            onSuccess={() => {
              router.push('/')
            }}
          />
        ) : (
          <SchemaForm
            form={form}
            schema={SignInSchema}
            onSubmit={signInWithPhone}
            defaultValues={{ phone: '', countrycode: '1' }}
            props={{
              countrycode: {
                // @ts-expect-error unsure how to get web props to work with tamagui
                'aria-label': 'Country Code',
                width: '35%',
                height: '$3',
              },
              phone: {
                'aria-label': 'Phone number',
                borderColor: 'rgba(195, 171, 142, 0.6)',
                borderWidth: 1,
                placeholder: 'Phone Number',
              },
            }}
            renderAfter={({ submit }) => (
              <>
                <Theme inverse>
                  <XStack
                    jc={'space-between'}
                    ai={'center'}
                    $lg={{ flexDirection: 'column' }}
                    $gtLg={{ flexDirection: 'row' }}
                  >
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
                        {'SEND IT!'}
                      </Paragraph>
                    </SubmitButton>
                    <Anchor href={'https://send.it'} target={'_blank'}>
                      <Paragraph
                        textAlign="center"
                        color={'#C3AB8E'}
                        size={'$1'}
                        fontWeight={'700'}
                      >
                        Learn More about SEND
                      </Paragraph>
                    </Anchor>
                  </XStack>
                </Theme>
              </>
            )}
          >
            {(fields) => (
              <>
                <YStack gap="$3" mb="$4">
                  <H4 $sm={{ size: '$8' }}>Welcome to Send</H4>
                  <Paragraph theme="alt1" size={'$1'}>
                    Sign up or Sign in with your phone number
                  </Paragraph>
                </YStack>
                <Paragraph size={'$1'} fontWeight={'500'}>
                  Your Phone
                </Paragraph>
                <XStack gap="$2" flex={1} display={'flex'}>
                  {Object.values(fields)}
                </XStack>
              </>
            )}
          </SchemaForm>
        )}
      </FormProvider>
      <Card
        bg={resolvedTheme}
        jc={'center'}
        ac={'center'}
        fw={'wrap'}
        fd="column"
        mt={'$20'}
        $sm={{
          marginTop: resolvedTheme?.startsWith('dark') ? '$12' : '$10',
          paddingTop: resolvedTheme?.startsWith('dark') ? '' : '$3',
        }}
      >
        {logoBottom()}
        <XStack
          mt={'$3'}
          $sm={{ marginTop: '$3' }}
          gap={'$2'}
          alignItems={'center'}
          justifyContent={'center'}
          ac={'center'}
        >
          <Paragraph size={'$1'}>Connect with us </Paragraph>
          <XStack gap={'$2'} mt={'$2'}>
            <Anchor
              href={'https://x.com/Send'}
              target={'_blank'}
              style={{ backgroundColor: '$color.gold10Dark' }}
            >
              <IconXLogo
                size="$1"
                color={
                  resolvedTheme?.startsWith('dark') ? '$color.gold10Light' : '$color.gold10Dark'
                }
              />
            </Anchor>
            <Anchor href={'https://t.me/send_app'} target={'_blank'}>
              <IconTelegramLogo
                size="$1"
                color={
                  resolvedTheme?.startsWith('dark') ? '$color.gold10Light' : '$color.gold10Dark'
                }
              />
            </Anchor>
          </XStack>
        </XStack>
      </Card>
    </>
  )
}
