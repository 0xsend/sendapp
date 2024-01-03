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
import { Button, Container, H1, H2, Input, Label, Paragraph, TextArea, YStack } from '@my/ui'
import { parseCreateResponse, COSEECDHAtoXY } from 'app/utils/passkeys'
import React, { useEffect, useState } from 'react'
import {
  bytesToHex,
  concat,
  Hex,
  hexToBytes,
  numberToBytes,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
} from 'viem'
import { baseMainnetClient, baseMainnetBundlerClient as bundlerClient } from 'app/utils/viem/client'
import { iEntryPointABI } from '@my/wagmi'
import { UserOperation, getSenderAddress } from 'permissionless'
import {
  USEROP_KEY_SLOT,
  USEROP_VALID_UNTIL,
  USEROP_VERSION,
  daimoAccountFactory,
  encodeCreateAccountData,
  entrypoint,
  generateUserOp,
  verifier,
} from 'app/utils/userop'
import { signChallenge, generateChallenge } from 'app/utils/userop'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { base16, base64 } from '@scure/base'
import { useUser } from 'app/utils/useUser'
import { assert } from 'app/utils/assert'
import { useSendAccounts } from 'app/utils/useSendAccounts'
import { base64ToBase16 } from 'app/utils/base64ToBase16'
import * as Device from 'expo-device'

export function OnboardingScreen() {
  const {
    data: sendAccts,
    error: sendAcctsError,
    isLoading: sendAcctsIsLoading,
  } = useSendAccounts()

  // TODO: remove me
  useEffect(() => {
    console.log('send accounts', { sendAccts, sendAcctsError, sendAcctsIsLoading })
  }, [sendAccts, sendAcctsError, sendAcctsIsLoading])

  const [publicKey, setPublicKey] = useState<[Hex, Hex] | null>(null)
  const [senderAddress, setSenderAddress] = useState<Hex | null>(null)

  // SIGNING / SENDING USEROP STATE
  const [userOp, setUserOp] = useState<UserOperation | null>(null)
  const [userOpHash, setUserOpHash] = useState<Hex | null>(null)
  const [challenge, setChallenge] = useState<Hex | null>(null)
  const [signature, setSignature] = useState<Uint8Array | null>(null)
  const [sendResult, setSendResult] = useState<boolean | null>(null)

  // monitor send accounts, automatically set the public key if there is one
  useEffect(() => {
    if (!sendAccts?.length) {
      return
    }
    const sendAcct = sendAccts[0]
    assert(!!sendAcct, 'No send account')
    const webauthnCred = sendAcct.webauthn_credentials[0]
    assert(!!webauthnCred, 'No send account credentials')
    setSenderAddress(sendAcct.address)
    setPublicKey(COSEECDHAtoXY(base16.decode(webauthnCred.public_key.slice(2).toUpperCase())))
  }, [sendAccts])

  // generate user op based on public key, and generate challenge from the user op hash
  // TODO: decouple generate user op from public key and instead only use sender address
  useEffect(() => {
    if (!publicKey) {
      return
    }
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
  async function _signWithPasskey() {
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

    setSignature(_signature)
  }

  return (
    <Container>
      <YStack space="$2" maxWidth={600} py="$6">
        <H1>Welcome to Send</H1>
        <Paragraph>
          Start by creating a Passkey below. Send uses passkeys to secure your account. Press the
          button below to get started.
        </Paragraph>

        <CreateSendAccount />

        <Label htmlFor="senderAddress">Your sender address:</Label>
        <TextArea
          id="senderAddress"
          height="$6"
          // @ts-expect-error setup monospace font
          fontFamily={'monospace'}
          value={senderAddress ? senderAddress : undefined}
        />

        {!signature || signature.byteLength <= 0 ? (
          <>
            <H2>Sign a user operation</H2>
            <Button onPress={_signWithPasskey}>Sign</Button>
          </>
        ) : null}

        <H2>Send it</H2>
        <Button
          onPress={async () => {
            if (!publicKey) {
              throw new Error('No public key')
            }

            if (!userOp || !userOpHash) {
              throw new Error('No userOp')
            }

            if (!signature || signature.byteLength <= 0) {
              throw new Error('No signature')
            }

            if (!senderAddress) {
              throw new Error('No sender address')
            }
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
    </Container>
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

    const passkeyName = `${user.id}.0`
    const [rawCred, authData] = await createPasskey({
      domain: window.location.hostname,
      challengeB64: base64.encode(Buffer.from('foobar')), // TODO: generate a random challenge from the server
      passkeyName,
      passkeyDisplayTitle: `Send App: ${accountName}`,
    }).then((r) => [r, parseCreateResponse(r)] as const)

    // save the credential to the database
    const { data: webauthnCred, error: credUpsertErr } = await supabase
      .from('webauthn_credentials')
      .upsert({
        name: passkeyName,
        display_name: accountName,
        raw_credential_id: `\\x${base64ToBase16(rawCred.credentialIDB64)}`,
        public_key: `\\x${base16.encode(authData.COSEPublicKey)}`,
        sign_count: 0,
        attestation_object: `\\x${base64ToBase16(rawCred.rawAttestationObjectB64)}`,
        key_type: 'ES256',
      })
      .select()
      .single()

    if (credUpsertErr) {
      throw credUpsertErr
    }

    const _publicKey = COSEECDHAtoXY(authData.COSEPublicKey)

    // store the init code in the database to avoid having to recompute it in case user drops off
    // and does not finish onboarding flow
    const initCode = concat([daimoAccountFactory.address, encodeCreateAccountData(_publicKey)])
    const senderAddress = await getSenderAddress(baseMainnetClient, {
      initCode,
      entryPoint: entrypoint.address,
    })

    // save the send account to the database
    const { data: sendAcct, error: sendAcctUpsertErr } = await supabase
      .from('send_accounts')
      .upsert(
        {
          address: senderAddress,
          chain_id: baseMainnetClient.chain.id,
          init_code: `\\x${initCode.slice(2)}`,
        },
        {
          onConflict: 'address, chain_id',
        }
      )
      .select()
      .single()

    if (sendAcctUpsertErr) {
      throw sendAcctUpsertErr
    }

    // associate the credential with the account
    const { error: sendAcctCredInsertErr } = await supabase.from('send_account_credentials').upsert(
      {
        account_id: sendAcct.id,
        credential_id: webauthnCred.id,
        key_slot: 0, // for create account, we always use key slot 0
      },
      {
        onConflict: 'account_id, credential_id',
      }
    )

    if (sendAcctCredInsertErr) {
      throw sendAcctCredInsertErr
    }

    await sendAcctsRefetch()

    // await createAccountUsingEOA(_publicKey)
  }

  return (
    // TODO: turn into a form
    <YStack space="$4">
      <Label htmlFor="accountName">Account name:</Label>
      <Input id="accountName" onChangeText={setAccountName} value={accountName} />
      <Button onPress={createAccount}>Create</Button>
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

  // always reverts
  await baseMainnetClient
    .simulateContract({
      address: entrypoint.address,
      functionName: 'simulateValidation',
      abi: iEntryPointABI,
      args: [_userOp],
    })
    .catch((e: ContractFunctionExecutionError) => {
      const cause: ContractFunctionRevertedError = e.cause
      if (cause.data?.errorName === 'ValidationResult') {
        const data = cause.data
        if ((data.args?.[0] as { sigFailed: boolean }).sigFailed) {
          throw new Error('Signature failed')
        }
      }
      if (cause.data?.errorName !== 'ValidationResult') {
        throw e
      }
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
