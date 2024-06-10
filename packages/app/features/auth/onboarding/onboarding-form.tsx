import { createPasskey } from '@daimo/expo-passkeys'
import {
  Anchor,
  BigHeading,
  ButtonText,
  H3,
  Paragraph,
  SubmitButton,
  Theme,
  XStack,
  YStack,
} from '@my/ui'
import { base16, base64 } from '@scure/base'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { api } from 'app/utils/api'
import { assert } from 'app/utils/assert'
import { base64ToBase16 } from 'app/utils/base64ToBase16'
import { parseCreateResponse } from 'app/utils/passkeys'
import { useSendAccount } from 'app/utils/send-accounts'
import { useIsClient } from 'app/utils/useIsClient'
import { useUser } from 'app/utils/useUser'
import * as Device from 'expo-device'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'solito/router'
import { z } from 'zod'

const OnboardingSchema = z.object({
  accountName: formFields.text,
})

export const OnboardingForm = () => {
  const sendAccountCreate = api.sendAccount.create.useMutation()
  const { user } = useUser()
  const form = useForm<z.infer<typeof OnboardingSchema>>()
  const { refetch: refetchSendAccount } = useSendAccount()
  const { replace } = useRouter()
  const deviceName = Device.deviceName
    ? Device.deviceName
    : `My ${Device.modelName ?? 'Send Account'}`

  async function createAccount({ accountName }: z.infer<typeof OnboardingSchema>) {
    try {
      assert(!!user?.id, 'No user id')
      const keySlot = 0
      const passkeyName = `${user.id}.${keySlot}` // 64 bytes max
      const [rawCred, authData] = await createPasskey({
        domain: window.location.hostname,
        challengeB64: base64.encode(Buffer.from('foobar')), // TODO: generate a random challenge from the server
        passkeyName,
        passkeyDisplayTitle: `Send App: ${accountName}`,
      }).then((r) => [r, parseCreateResponse(r)] as const)

      await sendAccountCreate
        .mutateAsync({
          accountName,
          passkeyName,
          rawCredentialIDB16: base64ToBase16(rawCred.credentialIDB64),
          cosePublicKeyB16: base16.encode(authData.COSEPublicKey),
          rawAttestationObjectB16: base64ToBase16(rawCred.rawAttestationObjectB64),
          keySlot,
        })
        .then(async () => {
          // success refetch accounts to check if account was created
          const { data: sendAcct, error: refetchError } = await refetchSendAccount()
          if (refetchError) throw refetchError
          if (sendAcct) {
            replace('/')
            return
          }
          form.setError('accountName', {
            type: 'custom',
            message: 'Account not created. Please try again.',
          })
        })
    } catch (error) {
      console.error('Error creating account', error)
      const message = error?.message.split('.')[0] ?? 'Unknown error'
      form.setError('accountName', { type: 'custom', message: message })
    }
  }
  const isClient = useIsClient()
  if (!isClient) return null

  return (
    <FormProvider {...form}>
      <SchemaForm
        form={form}
        schema={OnboardingSchema}
        onSubmit={createAccount}
        defaultValues={{ accountName: deviceName }}
        props={{
          accountName: {
            'aria-label': 'Account name',
            '$theme-dark': {
              borderBottomColor: '$accent9Light',
            },
            '$theme-light': {
              borderBottomColor: '$black',
            },
            borderWidth: 0,
            borderBottomWidth: 2,
            borderRadius: '$0',
            placeholder: 'My Send Account',
            fontFamily: '$mono',
            fontVariant: ['tabular-nums'],
            fontSize: 20,
            fontWeight: '400',
            width: '100%',
            backgroundColor: 'transparent',
            outlineColor: 'transparent',
            focusStyle: {
              borderBottomColor: '$accent3Light',
            },
            autoFocus: true,
          },
        }}
        renderAfter={({ submit }) => (
          <XStack
            jc="space-between"
            ai="center"
            w="100%"
            px="$2"
            $sm={{ jc: 'center', height: '100%' }}
          >
            <Anchor
              $theme-dark={{
                col: '$accentBackground',
              }}
              $theme-light={{ col: '$black' }}
              href="https://info.send.it/send/mission-vision-and-values"
              target="_blank"
              dsp="none"
              $gtMd={{ dsp: 'block' }}
            >
              Why Passkey?
            </Anchor>
            <Theme name={'accent_Button'}>
              <SubmitButton
                onPress={submit}
                mb="auto"
                als="auto"
                br="$4"
                mx="auto"
                w="100%"
                $gtMd={{
                  mt: '0',
                  als: 'flex-end',
                  mx: 0,
                  ml: 'auto',
                  maw: '$12',
                  h: '$3.5',
                }}
              >
                <ButtonText size={'$1'} padding={'unset'} ta="center" margin={'unset'} col="black">
                  CREATE PASSKEY
                </ButtonText>
              </SubmitButton>
            </Theme>
          </XStack>
        )}
      >
        {(fields) => (
          <YStack gap="$5" jc="center" $sm={{ f: 1 }}>
            <Theme inverse={true}>
              <BigHeading col="$background">SETUP PASSKEY</BigHeading>
            </Theme>
            <H3
              lineHeight={28}
              $platform-web={{ fontFamily: '$mono' }}
              $theme-light={{ col: '$gray10Light' }}
              $theme-dark={{ col: '$olive' }}
              fontWeight={'300'}
              $sm={{ size: '$5' }}
            >
              Start by creating a Passkey below. Send uses passkeys to secure your account
            </H3>
            <YStack gap="$4">
              <Theme inverse={true}>
                <Paragraph col="$background" size={'$1'} fontWeight={'500'}>
                  Passkey Name
                </Paragraph>
              </Theme>
              <YStack gap="$4" f={1}>
                {Object.values(fields)}
                <Anchor
                  $theme-dark={{
                    col: '$accentBackground',
                  }}
                  $theme-light={{ col: '$black' }}
                  href="https://info.send.it/send/mission-vision-and-values"
                  target="_blank"
                  dsp="flex"
                  jc="flex-end"
                  $gtMd={{ dsp: 'none' }}
                >
                  Why Passkey?
                </Anchor>
              </YStack>
            </YStack>
          </YStack>
        )}
      </SchemaForm>
    </FormProvider>
  )
}
