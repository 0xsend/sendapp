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
  H2,
  Input,
  Label,
  Paragraph,
  Stack,
  YStack,
  Link,
  XStack,
  CornerTriangle,
  Image,
  useWindowDimensions,
  Theme,
  useMedia,
  Anchor,
  H3,
  useToastController,
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
import {
  IconSLogo,
  IconSendLogo,
  IconTelegramLogo,
  IconXLogo,
  IconCopy,
} from 'app/components/icons'
import { telegram as telegramSocial, twitter as twitterSocial } from 'app/data/socialLinks'
import { useState } from 'react'
import { getSenderAddress } from 'permissionless'
import { shorten } from 'app/utils/strings'
import { testClient } from 'app/utils/userop'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'

export function OnboardingScreen() {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions()
  const media = useMedia()
  const {
    data: sendAccts,
    // error: sendAcctsError,
    // isLoading: sendAcctsIsLoading,
  } = useSendAccounts()

  return (
    <YStack
      ai="center"
      jc="space-between"
      h={windowHeight * 0.95}
      w={windowWidth * 0.95}
      px="$6"
      m="auto"
    >
      <Stack pos="absolute" top={0} left={0} mt="auto" mb="auto" zIndex={-1} w="100%" h="100%">
        <Stack mt="auto" mb="auto" w="100%" h="100%" zIndex={1}>
          <Stack
            position="absolute"
            bottom={'$0'}
            right={'$0'}
            dsp="none"
            $gtMd={{ dsp: 'inherit' }}
            zIndex={1}
          >
            <IconSLogo size={'$4'} />
          </Stack>
          <CornerTriangle
            btc={'$background'}
            corner="topLeft"
            pos="absolute"
            top={0}
            left={0}
            btw={273}
            brw={90}
          />
          <Image
            width="100%"
            height="100%"
            source={{
              height: windowHeight * 0.95,
              uri: 'https://raw.githubusercontent.com/0xsend/assets/main/app_images/setup-passkey.jpg',
            }}
            style={{ borderRadius: 33, zIndex: -1, opacity: 0.1 }}
          />
          <CornerTriangle
            btc={'$background'}
            corner="bottomRight"
            pos="absolute"
            bottom={0}
            right={0}
            btw={273}
            brw={90}
          />
        </Stack>
      </Stack>
      <Stack f={1} jc="center">
        <Theme inverse={true}>
          <IconSendLogo size={media.gtMd ? '$6' : '$4'} color="$background" />
        </Theme>
      </Stack>
      <YStack f={3} jc="center" maw="100%" $gtMd={{ maw: 400 }} space="$4">
        {sendAccts?.length === 0 ? (
          <>
            <YStack pb="$4" space="$2" f={1} jc={'flex-end'}>
              <Theme inverse={true}>
                <H2 color={'$green100'}>Setup Passkey</H2>
              </Theme>
              <Paragraph>
                Start by creating a Passkey below. Send uses passkeys to secure your account.
              </Paragraph>
            </YStack>
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
  const media = useMedia()

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
    const initCode = concat([daimoAccountFactory.address, encodeCreateAccountData(_publicKey)])
    const senderAddress = await getSenderAddress(baseMainnetClient, {
      initCode,
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
      <Label htmlFor="accountName">Passkey name</Label>
      <Input id="accountName" onChangeText={setAccountName} value={accountName} />
      {media.gtMd ? (
        <XStack jc="space-between" ai="center" w="100%" px="$2">
          <Anchor
            col={'$accentBackground'}
            href="https://info.send.it/send/mission-vision-and-values"
            target="_blank"
            dsp={'none'}
            $gtMd={{ dsp: 'block' }}
          >
            Why Passkey?
          </Anchor>
          <Theme name={'accent_Button'}>
            <Button onPress={createAccount} mt="0" als="flex-end" miw="$12">
              Create
            </Button>
          </Theme>
        </XStack>
      ) : (
        <Theme name={'accent_Button'}>
          <Button onPress={createAccount} mt="auto" als="auto">
            Create
          </Button>
        </Theme>
      )}
    </YStack>
  )
}

function SendAccountCongratulations() {
  const toast = useToastController()
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

        {__DEV__ && !!sendAcct && (
          <Theme name="dim">
            <YStack pt="$4" gap="$4">
              <YStack gap="$2">
                <Paragraph mx="auto">⭐️ Secret Shop ⭐️</Paragraph>
                <Paragraph mx="auto">Available on Localnet/Testnet only.</Paragraph>
              </YStack>
              <Button
                onPress={async () => {
                  await testClient.setBalance({
                    address: sendAcct.address,
                    value: parseEther('10'),
                  })
                  toast.show('Funded with 10 ETH')
                }}
              >
                Fund with 10 ETH
              </Button>
              <Button
                onPress={async () => {
                  await setERC20Balance({
                    client: testClient,
                    address: sendAcct.address,
                    tokenAddress: usdcAddress[baseMainnetClient.chain.id],
                    value: BigInt(100e6),
                  })
                  toast.show('Funded with 100 USDC')
                }}
              >
                Fund with 100 USDC
              </Button>
            </YStack>
          </Theme>
        )}
      </Stack>
    </YStack>
  )
}
