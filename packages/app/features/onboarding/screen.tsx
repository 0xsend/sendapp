/**
 * Onboarding screen will ultimately be the first screen a user sees when they open the app or after they sign up.
 *
 * It needs to:
 * - Introduce to Send
 * - Create a passkey
 * - Generate a deterministic address from the public key
 * - Ask the user to deposit funds
 */
import { createPasskey } from '@daimo/expo-passkeys'
import {
  Button,
  Footer,
  Input,
  Label,
  Paragraph,
  Stack,
  YStack,
  Link,
  XStack,
  Theme,
  useMedia,
  Anchor,
  H3,
  H1,
} from '@my/ui'
import { base16, base64 } from '@scure/base'
import { assert } from 'app/utils/assert'
import { base64ToBase16 } from 'app/utils/base64ToBase16'
import { COSEECDHAtoXY, parseCreateResponse } from 'app/utils/passkeys'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useSendAccounts } from 'app/utils/send-accounts'
import { useUser } from 'app/utils/useUser'
import { daimoAccountFactory, encodeCreateAccountData, entrypoint } from 'app/utils/userop'
import { baseMainnetClient, usdcAddress } from '@my/wagmi'
import * as Device from 'expo-device'
import { concat, parseEther } from 'viem'
import { IconSendLogo, IconTelegramLogo, IconXLogo, IconCopy } from 'app/components/icons'
import { telegram as telegramSocial, twitter as twitterSocial } from 'app/data/socialLinks'
import { useState } from 'react'
import { getSenderAddress } from 'permissionless'
import { shorten } from 'app/utils/strings'
import { testClient } from 'app/utils/userop'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'

export function OnboardingScreen() {
  const media = useMedia()
  const {
    data: sendAccts,
    // error: sendAcctsError,
    // isLoading: sendAcctsIsLoading,
  } = useSendAccounts()

  return (
    <YStack w="100%" h={'100%'} jc="flex-start" p="$7">
      <Stack f={1} $gtMd={{ dsp: 'none' }}>
        <IconSendLogo size={'$2'} color="$white" />
      </Stack>

      <YStack f={3} jc="center" maw="100%" space="$4" gap="$4">
        {sendAccts?.length === 0 ? (
          <>
            <Theme inverse={true}>
              <H1 col="$background" size="$11">
                SETUP PASSKEY
              </H1>
            </Theme>
            <H3 fontWeight="normal" theme="active" $sm={{ size: '$4' }}>
              Start by creating a Passkey below. Send uses passkeys to secure your account.
            </H3>
            <CreateSendAccount />
          </>
        ) : (
          <SendAccountCongratulations />
        )}
      </YStack>
      {media.gtMd && (
        <Footer f={1} jc={'center'}>
          <XStack gap="$4" ai="center" jc="center">
            <Paragraph>Connect With Us</Paragraph>
            <Link href={twitterSocial} target="_blank">
              <Button borderRadius={9999} icon={IconXLogo} />
            </Link>
            <Link href={telegramSocial} target="_blank">
              <Button borderRadius={9999} icon={IconTelegramLogo} />
            </Link>
          </XStack>
        </Footer>
      )}
    </YStack>
  )
}

/**
 * Create a send account but not onchain, yet.
 */
function CreateSendAccount() {
  // REMOTE / SUPABASE STATE
  const supabase = useSupabase()
  const { user } = useUser()
  const { refetch: sendAcctsRefetch } = useSendAccounts()

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

    if (__DEV__) {
      console.log('Funding sending address', senderAddress)
      await testClient.setBalance({
        address: senderAddress,
        value: parseEther('1'),
      })
      await setERC20Balance({
        client: testClient,
        address: senderAddress,
        tokenAddress: usdcAddress[baseMainnetClient.chain.id],
        value: BigInt(100e6),
      })
    }

    await sendAcctsRefetch()

    // await createAccountUsingEOA(_publicKey)
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

function SendAccountCongratulations() {
  const { data: sendAccts } = useSendAccounts()
  const sendAcct = sendAccts?.[0]
  return (
    <YStack w="100%" space="$4" f={1}>
      <H3>Congratulations on opening your first Send Account! </H3>
      <Paragraph>Let&apos;s get you sending</Paragraph>
      <Stack f={1} jc="center" ai="center">
        <Paragraph ta="center">First, fund your account by sending ETH here</Paragraph>
        <XStack>
          <Paragraph ta="center" fontWeight="bold">
            ${shorten(sendAcct?.address)}
          </Paragraph>
          <IconCopy />
        </XStack>
      </Stack>
    </YStack>
  )
}
