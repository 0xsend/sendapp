import { createPasskey } from '@daimo/expo-passkeys'
import { base16, base64 } from '@scure/base'
import { assert } from 'app/utils/assert'
import { base64ToBase16 } from 'app/utils/base64ToBase16'
import { COSEECDHAtoXY, parseCreateResponse } from 'app/utils/passkeys'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { daimoAccountFactory, encodeCreateAccountData, entrypoint } from 'app/utils/userop'
import { baseMainnetClient } from '@my/wagmi'
import * as Device from 'expo-device'
import { concat, zeroAddress } from 'viem'
import { getSenderAddress } from 'permissionless'
import {
  Anchor,
  YStack,
  Theme,
  XStack,
  SubmitButton,
  ButtonText,
  Paragraph,
  BigHeading,
  H3,
  FontLanguage,
} from '@my/ui'
import { SchemaForm, formFields } from 'app/utils/SchemaForm'
import { z } from 'zod'
import { useForm, FormProvider } from 'react-hook-form'
import { useSendAccounts } from 'app/utils/send-accounts'
import { useRouter } from 'solito/router'

const OnboardingSchema = z.object({
  accountName: formFields.text,
})

/**
 * Create a send account but not onchain, yet.
 */
export const OnboardingForm = () => {
  // REMOTE / SUPABASE STATE
  const supabase = useSupabase()
  const { user } = useUser()
  const form = useForm<z.infer<typeof OnboardingSchema>>()
  const { refetch: refetchSendAccounts } = useSendAccounts()
  const { replace } = useRouter()

  // PASSKEY / ACCOUNT CREATION STATE
  const deviceName = Device.deviceName
    ? Device.deviceName
    : `My ${Device.modelName ?? 'Send Account'}`

  // TODO: split creating the on-device and remote creation to introduce retries in-case of failures
  async function createAccount({ accountName }: z.infer<typeof OnboardingSchema>) {
    assert(!!user?.id, 'No user id')

    const keySlot = 0
    const passkeyName = `${user.id}.${keySlot}` // 64 bytes max
    const [rawCred, authData] = await createPasskey({
      domain: window.location.hostname,
      challengeB64: base64.encode(Buffer.from('foobar')), // TODO: generate a random challenge from the server
      passkeyName,
      passkeyDisplayTitle: `Send App: ${accountName}`,
    }).then((r) => [r, parseCreateResponse(r)] as const)

    // store the init code in the database to avoid having to recompute it in case user drops off
    // and does not finish onboarding flow
    const _publicKey = COSEECDHAtoXY(authData.COSEPublicKey)
    const factory = daimoAccountFactory.address
    const factoryData = encodeCreateAccountData(_publicKey)
    const initCode = concat([factory, factoryData])
    const senderAddress = await getSenderAddress(baseMainnetClient, {
      factory,
      factoryData,
      entryPoint: entrypoint.address,
    })
    assert(!!senderAddress, 'No sender address')
    assert(senderAddress !== zeroAddress, 'Zero sender address')
    const { error } = await supabase.rpc('create_send_account', {
      send_account: {
        address: senderAddress,
        chain_id: baseMainnetClient.chain.id,
        init_code: `\\x${initCode.slice(2)}`,
      },
      webauthn_credential: {
        name: passkeyName,
        display_name: accountName,
        raw_credential_id: `\\x${base64ToBase16(rawCred.credentialIDB64)}`,
        public_key: `\\x${base16.encode(authData.COSEPublicKey)}`,
        sign_count: 0,
        attestation_object: `\\x${base64ToBase16(rawCred.rawAttestationObjectB64)}`,
        key_type: 'ES256',
      },
      key_slot: keySlot,
    })

    if (error) {
      throw error
    }
    try {
      const { data: sendAccts, error: refetchError } = await refetchSendAccounts()
      if (refetchError) throw refetchError
      if (sendAccts?.length && sendAccts.length > 0) replace('/')
    } catch (e) {
      throw Error(`Sorry something went wrong \n\n ${e}`)
    }
  }

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
            placeholder: deviceName,
            fontFamily: '$mono',
            fontVariant: ['tabular-nums'],
            fontSize: 20,
            width: '100%',
            backgroundColor: 'transparent',
            outlineColor: 'transparent',
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
              <YStack space="$4" f={1}>
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
