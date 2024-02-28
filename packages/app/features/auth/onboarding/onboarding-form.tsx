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
import { concat } from 'viem'
import { useState } from 'react'
import { getSenderAddress } from 'permissionless'
import { Input, Label, Anchor, YStack, Theme, XStack, Button } from '@my/ui'
import { useSendAccounts } from 'app/utils/send-accounts'

/**
 * Create a send account but not onchain, yet.
 */
export const OnboardingForm = () => {
  // REMOTE / SUPABASE STATE
  const supabase = useSupabase()
  const { user } = useUser()
  const { refetch: refetchSendAccounts } = useSendAccounts()

  // PASSKEY / ACCOUNT CREATION STATE
  const deviceName = Device.deviceName
    ? Device.deviceName
    : `My ${Device.modelName ?? 'Send Account'}`
  const [accountName, setAccountName] = useState<string>(deviceName) // TODO: use expo-device to get device name

  // TODO: split creating the on-device and remote creation to introduce retries in-case of failures
  async function createAccount() {
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
    await refetchSendAccounts()
  }

  return (
    // TODO: turn into a form
    <YStack space="$4" f={1}>
      <Theme inverse={true}>
        <Label htmlFor="accountName" color={'$background'}>
          Passkey name
        </Label>
      </Theme>
      <YStack space="$4" f={1}>
        <Input
          id="accountName"
          borderBottomColor="$accent9Light"
          borderWidth={0}
          borderBottomWidth={2}
          borderRadius="$0"
          width="100%"
          backgroundColor="transparent"
          outlineColor="transparent"
          onChangeText={setAccountName}
          value={accountName}
        />
        <Anchor
          col={'$accentBackground'}
          href="https://info.send.it/send/mission-vision-and-values"
          target="_blank"
          dsp="flex"
          jc="flex-end"
          $gtMd={{ dsp: 'none' }}
        >
          Why Passkey?
        </Anchor>
      </YStack>

      <XStack jc="space-between" ai="center" w="100%" px="$2">
        <Anchor
          col={'$accentBackground'}
          href="https://info.send.it/send/mission-vision-and-values"
          target="_blank"
          dsp="none"
          $gtMd={{ dsp: 'block' }}
        >
          Why Passkey?
        </Anchor>
        <Theme name={'accent_Button'}>
          <Button
            onPress={createAccount}
            mb="auto"
            als="auto"
            br="$4"
            mx="auto"
            w="100%"
            $gtMd={{ mt: '0', als: 'flex-end', miw: '$12' }}
          >
            Create Passkey
          </Button>
        </Theme>
      </XStack>
    </YStack>
  )
}
