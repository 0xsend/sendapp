import { createPasskey } from '@daimo/expo-passkeys'
import {
  Anchor,
  BigHeading,
  ButtonText,
  H3,
  Paragraph,
  Stack,
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
import { useEffect, useState } from 'react'
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
  const sendAccount = useSendAccount()
  const { replace } = useRouter()
  const deviceName = Device.deviceName
    ? Device.deviceName
    : `My ${Device.modelName ?? 'Send Account'}`

  const [errorMessage, setErrorMessage] = useState<string>()

  async function createAccount({ accountName }: z.infer<typeof OnboardingSchema>) {
    try {
      assert(!!user?.id, 'No user id')

      // double check that the user has not already created a send account before creating a passkey
      const { data: sendAcct, error: refetchError } = await sendAccount.refetch()
      if (refetchError) throw refetchError
      if (sendAcct) {
        throw new Error(`Account already created: ${sendAcct.address}`)
      }

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
          const { data: sendAcct, error: refetchError } = await sendAccount.refetch()
          if (refetchError) throw refetchError
          if (sendAcct) {
            replace('/')
            return
          }
          setErrorMessage('Account not created. Please try again.')
          form.setError('accountName', { type: 'custom' })
        })
    } catch (error) {
      console.error('Error creating account', error)
      const message = error?.message.split('.')[0] ?? 'Unknown error'
      setErrorMessage(message)
      form.setError('accountName', { type: 'custom' })
    }
  }
  const isClient = useIsClient()

  useEffect(() => {
    if (sendAccount.data?.address) {
      replace('/') // redirect to home page if account already exists
    }
  }, [sendAccount.data?.address, replace])

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
              borderBottomColor: '$green9Light',
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
              borderBottomColor: '$green3Light',
            },
            autoFocus: true,
          },
        }}
        renderAfter={({ submit }) => (
          <>
            <XStack
              jc="space-between"
              ai="center"
              w="100%"
              px="$2"
              $sm={{ jc: 'center', height: '100%' }}
            >
              <Anchor
                $theme-dark={{
                  col: '$background',
                }}
                $theme-light={{ col: '$black' }}
                href="https://help.send.app/what-are-passkeys/"
                target="_blank"
                dsp="none"
                $gtMd={{ dsp: 'block' }}
              >
                Why Passkey?
              </Anchor>

              <SubmitButton
                onPress={submit}
                theme={errorMessage ? 'yellow_active' : 'green'}
                mb="auto"
                als="auto"
                r
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
                <ButtonText
                  size={'$2'}
                  padding={'unset'}
                  textTransform="uppercase"
                  ta="center"
                  margin={'unset'}
                  col="black"
                >
                  {errorMessage ? 'Try again' : 'CREATE PASSKEY'}
                </ButtonText>
              </SubmitButton>
            </XStack>
          </>
        )}
      >
        {(fields) => (
          <YStack gap="$5" jc="center" $sm={{ f: 1 }}>
            <Theme inverse={true}>
              <BigHeading col="$background" fontWeight={700}>
                OPEN ACCOUNT
              </BigHeading>
            </Theme>
            <H3
              lineHeight={28}
              $platform-web={{ fontFamily: '$mono' }}
              $theme-light={{ col: '$gray10Light' }}
              $theme-dark={{ col: '$olive' }}
              fontWeight={'300'}
              $sm={{ size: '$5' }}
            >
              Send will securely save your key on this device. Name it so you can recognize it next
              time
            </H3>
            <YStack gap="$4">
              <YStack gap="$4" f={1}>
                {Object.values(fields)}
                <Anchor
                  $theme-dark={{
                    col: '$greenBackground',
                  }}
                  $theme-light={{ col: '$black' }}
                  href="https://help.send.app/what-are-passkeys/"
                  target="_blank"
                  dsp="flex"
                  jc="flex-end"
                  $gtMd={{ dsp: 'none' }}
                >
                  Why Passkey?
                </Anchor>
                <Stack maw={382}>
                  <Paragraph theme="red" color="$color9" flexWrap="wrap">
                    {errorMessage}
                  </Paragraph>
                </Stack>
              </YStack>
            </YStack>
          </YStack>
        )}
      </SchemaForm>
    </FormProvider>
  )
}
