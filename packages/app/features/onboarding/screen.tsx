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
  TextArea,
  YStack,
  Link,
  XStack,
  CornerTriangle,
  Image,
  useWindowDimensions,
  Theme,
  useMedia,
  Anchor,
} from '@my/ui'
import { iEntryPointAbi } from '@my/wagmi'
import { base16, base64 } from '@scure/base'
import { assert } from 'app/utils/assert'
import { base64ToBase16 } from 'app/utils/base64ToBase16'
import { COSEECDHAtoXY, parseCreateResponse } from 'app/utils/passkeys'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useSendAccounts } from 'app/utils/send-accounts'
import { useUser } from 'app/utils/useUser'
import {
  USEROP_KEY_SLOT,
  USEROP_VALID_UNTIL,
  USEROP_VERSION,
  daimoAccountFactory,
  encodeCreateAccountData,
  entrypoint,
  generateUserOp,
  receiverAccount,
  verifier,
} from 'app/utils/userop'
import { generateChallenge, signChallenge } from 'app/utils/userop'
import { baseMainnetBundlerClient as bundlerClient, baseMainnetClient } from 'app/utils/viem/client'
import * as Device from 'expo-device'
import { UserOperation, getSenderAddress } from 'permissionless'
import React, { useEffect, useState } from 'react'
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  Hex,
  bytesToHex,
  concat,
  hexToBytes,
  numberToBytes,
  parseEther,
} from 'viem'
import { testBaseClient } from '../../../playwright/tests/fixtures/viem/base'
import {
  IconSLogo,
  IconSendLogoGreenSlash,
  IconTelegramLogo,
  IconXLogo,
} from 'app/components/icons'
import { telegram as telegramSocial, twitter as twitterSocial } from 'app/data/socialLinks'

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
          <IconSendLogoGreenSlash size={media.gtMd ? '$14' : '$10'} color="$background" />
        </Theme>
      </Stack>
      <YStack f={3} jc="center" maw={600} space="$4">
        {sendAccts?.length === 0 ? (
          <>
            <YStack space="$4" f={1} jc={'flex-end'}>
              <H2>Setup Passkey</H2>
              <Paragraph>
                Start by creating a Passkey below. Send uses passkeys to secure your account. Press
                the button below to get started.
              </Paragraph>
            </YStack>
            <CreateSendAccount />
          </>
        ) : (
          <SendAccountUserOp />
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

    await sendAcctsRefetch()

    // await createAccountUsingEOA(_publicKey)
  }

  return (
    // TODO: turn into a form
    <YStack space="$4" f={1}>
      <Label htmlFor="accountName">Passkey name:</Label>
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

/**
 * Send a Send Account user operation to the bundler
 */
function SendAccountUserOp() {
  const { data: sendAccts } = useSendAccounts()
  const sendAcct = sendAccts?.[0]
  const webauthnCred = sendAcct?.webauthn_credentials?.[0]

  const [publicKey, setPublicKey] = useState<[Hex, Hex] | null>(null)
  const [senderAddress, setSenderAddress] = useState<Hex | null>(null)

  // SIGNING / SENDING USEROP STATE
  const [userOp, setUserOp] = useState<UserOperation | null>(null)
  const [userOpHash, setUserOpHash] = useState<Hex | null>(null)
  const [challenge, setChallenge] = useState<Hex | null>(null)
  const [sendResult, setSendResult] = useState<boolean | null>(null)

  // monitor send accounts, automatically set the public key if there is one
  useEffect(() => {
    if (!sendAcct) {
      return
    }
    assert(!!sendAcct, 'No send account')
    assert(!!webauthnCred, 'No send account credentials')
    setSenderAddress(sendAcct.address)
    setPublicKey(COSEECDHAtoXY(base16.decode(webauthnCred.public_key.slice(2).toUpperCase())))
  }, [sendAcct, webauthnCred])

  // generate user op based on public key, and generate challenge from the user op hash
  // TODO: decouple generate user op from public key and instead only use sender address
  useEffect(() => {
    if (!publicKey) {
      return
    }
    // eslint-disable-next-line no-extra-semi
    ;(async () => {
      const { userOp: _userOp, userOpHash: _userOpHash } = await generateUserOp(publicKey)

      // generate challenge
      const _challenge = generateChallenge(_userOpHash)

      setSenderAddress(_userOp.sender)
      setUserOp(_userOp)
      setUserOpHash(_userOpHash)
      setChallenge(_challenge)
    })()
  }, [publicKey])
  /**
   * Sign the challenge with the passkey.
   *
   * Assumes key slot 0 on the account.
   */
  async function signWithPasskey() {
    if (!challenge || challenge.length <= 0) {
      throw new Error('No challenge')
    }
    if (!userOpHash) {
      throw new Error('No userOpHash')
    }
    if (!publicKey) {
      throw new Error('No publicKey')
    }
    const encodedWebAuthnSig = await signChallenge(challenge)
    if (!encodedWebAuthnSig || encodedWebAuthnSig.length <= 2) {
      throw new Error('No encodedWebAuthnSig')
    }
    const _signature = concat([
      numberToBytes(USEROP_VERSION, { size: 1 }),
      numberToBytes(USEROP_VALID_UNTIL, { size: 6 }),
      numberToBytes(USEROP_KEY_SLOT, { size: 1 }),
      hexToBytes(encodedWebAuthnSig),
    ])

    // verify signature is correct
    const message = challenge
    const signature = bytesToHex(_signature.slice(7))
    const x = BigInt(publicKey[0])
    const y = BigInt(publicKey[1])

    // verify signature
    const result = await verifier.read.verifySignature([message, signature, x, y])

    if (!result) {
      throw new Error('Signature invalid')
    }

    return _signature
  }

  return (
    <YStack space="$4">
      <H2>Send it</H2>
      <Label htmlFor="sendTo">Sending to:</Label>
      <Input id="sendTo" aria-label="sendTo" value={receiverAccount.address} />
      <Label htmlFor="sendAmount">ETH Amount:</Label>
      <Input id="sendAmount" value="0.01" />
      <Button
        onPress={async () => {
          if (!publicKey) {
            throw new Error('No public key')
          }

          if (!userOp || !userOpHash) {
            throw new Error('No userOp')
          }

          if (!senderAddress) {
            throw new Error('No sender address')
          }

          const signature = await signWithPasskey()
          setSendResult(await sendUserOp({ userOp, signature }))
        }}
      >
        Send
      </Button>
      <Label htmlFor="sendResult">Send result:</Label>
      <TextArea
        id="sendResult"
        height="$6"
        // @ts-expect-error setup monospace font
        fontFamily={'monospace'}
        value={sendResult ? sendResult.toString() : undefined}
      />
    </YStack>
  )
}

async function sendUserOp({
  userOp,
  signature,
}: {
  userOp: UserOperation
  signature: Uint8Array
}): Promise<boolean> {
  const _userOp: UserOperation = {
    ...userOp,
    signature: bytesToHex(signature),
  }

  if (__DEV__ || process.env.CI) {
    console.log('Funding sending address', _userOp.sender)
    await testBaseClient.setBalance({
      address: _userOp.sender,
      value: parseEther('1'),
    })
  }

  // [simulateValidation](https://github.com/eth-infinitism/account-abstraction/blob/187613b0172c3a21cf3496e12cdfa24af04fb510/contracts/interfaces/IEntryPoint.sol#L152)
  await baseMainnetClient
    .simulateContract({
      address: entrypoint.address,
      functionName: 'simulateValidation',
      abi: iEntryPointAbi,
      args: [_userOp],
    })
    .catch((e: ContractFunctionExecutionError) => {
      const cause: ContractFunctionRevertedError = e.cause
      if (cause.data?.errorName === 'ValidationResult') {
        const data = cause.data
        if ((data.args?.[0] as { sigFailed: boolean }).sigFailed) {
          throw new Error('Signature failed')
        }
        // console.log('ValidationResult', data)
        return data
      }
      throw e
    })

  // [simulateHandleOp](https://github.com/eth-infinitism/account-abstraction/blob/187613b0172c3a21cf3496e12cdfa24af04fb510/contracts/interfaces/IEntryPoint.sol#L203)
  await baseMainnetClient
    .simulateContract({
      address: entrypoint.address,
      functionName: 'simulateHandleOp',
      abi: iEntryPointAbi,
      args: [
        _userOp,
        '0x0000000000000000000000000000000000000000', // target address TODO: optionally return target address result
        '0x', // target calldata
      ],
    })
    .catch((e: ContractFunctionExecutionError) => {
      const cause: ContractFunctionRevertedError = e.cause
      if (cause.data?.errorName === 'ExecutionResult') {
        const data = cause.data
        if ((data.args?.[0] as { success: boolean }).success) {
          throw new Error('Handle op failed')
        }
        // console.log('ExecutionResult', data)
        // TODO: use to estimate gas
        return data
      }
      throw e
    })

  const hash = await bundlerClient.sendUserOperation({
    userOperation: _userOp,
    entryPoint: entrypoint.address,
  })
  const receipt = await bundlerClient.waitForUserOperationReceipt({ hash })
  if (receipt.success !== true) {
    throw new Error('Failed to send userOp')
  }
  return receipt.success
}
