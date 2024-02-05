import {
  H4,
  Paragraph,
  SideBar,
  SideBarWrapper,
  Stack,
  SubmitButton,
  Theme,
  XStack,
  YStack,
  YStackProps,
  useMedia,
} from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconSendLogo, IconTelegramLogo, IconXLogo } from 'app/components/icons'
import { SideBarFooterLink } from 'app/components/sidebar/SideBarFooterLink'
import { telegram as telegramSocial, twitter as twitterSocial } from 'app/data/socialLinks'
import { VerifyCode } from 'app/features/auth/components/VerifyCode'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { api } from 'app/utils/api'

import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { z } from 'zod'

const SignInSchema = z.object({
  countrycode: formFields.countrycode,
  phone: formFields.text,
})

const SignInSideBar = ({ ...props }: YStackProps) => (
  <SideBar width="28%" maw="405px" {...props}>
    <Stack href={'/'} f={1} jc="center">
      <IconSendLogo />
    </Stack>
    <YStack f={1} gap="$4" ai="center" jc="center">
      <SignInForm />
    </YStack>
    <YStack gap="$4" ai="center" f={1} jc="flex-end">
      <XStack gap="$2" ai="center">
        <Paragraph size={'$1'} color={'$gray11'}>
          Connect with us
        </Paragraph>

        <SideBarFooterLink
          icon={<IconXLogo />}
          href={twitterSocial}
          target="_blank"
          borderRadius={9999}
        />
        <SideBarFooterLink
          icon={<IconTelegramLogo />}
          href={telegramSocial}
          target="_blank"
          borderRadius={9999}
        />
      </XStack>
    </YStack>
  </SideBar>
)

const SignInForm = () => {
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
  return (
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
          flex={1}
          form={form}
          schema={SignInSchema}
          onSubmit={signInWithPhone}
          defaultValues={{ phone: '', countrycode: '' }}
          props={{
            countrycode: {
              // @ts-expect-error unsure how to get web props to work with tamagui
              'aria-label': 'Country Code',
              height: '$3',
            },
            phone: {
              'aria-label': 'Phone number',
              borderBottomColor: '$accentBackground',
              borderWidth: 0,
              borderBottomWidth: 2,
              borderRadius: '$0',
              placeholder: 'Phone Number',
              width: '100%',
              backgroundColor: 'transparent',
            },
          }}
          renderAfter={({ submit }) => (
            <>
              <Theme inverse>
                <XStack jc={'flex-end'} ai={'center'}>
                  <SubmitButton
                    onPress={() => submit()}
                    borderRadius="$4"
                    backgroundColor={'$accentBackground'}
                    width={'$12'}
                    $sm={{ width: '$10' }}
                  >
                    <Paragraph
                      size={'$1'}
                      textAlign={'center'}
                      fontWeight={'700'}
                      padding={'unset'}
                      margin={'unset'}
                      // theme={resolvedTheme?.startsWith('dark') ?? 'light'}
                    >
                      {'/SEND IT!'}
                    </Paragraph>
                  </SubmitButton>
                </XStack>
              </Theme>
            </>
          )}
        >
          {(fields) => (
            <>
              <YStack gap="$3" mb="$4">
                <H4
                  $sm={{ size: '$8' }}
                  color={resolvedTheme?.startsWith('dark') ? '#FFFFFF' : '#212121'}
                >
                  Welcome to Send
                </H4>
                <Paragraph
                  theme="alt1"
                  size={'$1'}
                  color={resolvedTheme?.startsWith('dark') ? '#C3C3C3' : '#676767'}
                >
                  Sign up or Sign in with your phone number
                </Paragraph>
              </YStack>
              <Paragraph
                size={'$1'}
                fontWeight={'500'}
                color={resolvedTheme?.startsWith('dark') ? '#FFFFFF' : '#212121'}
              >
                Your Phone
              </Paragraph>
              <XStack gap="$2">{Object.values(fields)}</XStack>
            </>
          )}
        </SchemaForm>
      )}
    </FormProvider>
  )
}

export const SignInSideBarWrapper = ({ children }: { children?: React.ReactNode }) => {
  return (
    <SideBarWrapper sidebar={<SignInSideBar backgroundColor={'$backgroundStrong'} />}>
      {children}
    </SideBarWrapper>
  )
}
