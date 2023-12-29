/**
 * Onboarding screen will ultimately be the first screen a user sees when they open the app or after they sign up.
 *
 * It needs to:
 * - Introduce to Send
 * - Create a passkey
 * - Generate a deterministic address from the public key
 * - Ask the user to deposit funds
 */
import { type CreateResult, createPasskey } from '@daimo/expo-passkeys'
import { Button, Container, H1, H2, Input, Label, TextArea, YStack } from '@my/ui'
import { derKeytoContractFriendlyKey, parseCreateResponse } from 'app/utils/passkeys'
import React, { useState } from 'react'
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
import { UserOperation } from 'permissionless'
import {
  USEROP_KEY_SLOT,
  USEROP_VALID_UNTIL,
  USEROP_VERSION,
  entrypoint,
  generateUserOp,
  verifier,
} from 'app/utils/userop'
import { generateChallenge } from 'app/utils/userop'
import { signChallenge } from 'app/utils/userop'

export function OnboardingScreen() {
  const [accountName, setAccountName] = useState<string>(`Sender ${new Date().toLocaleString()}.0`)
  const [createResult, setCreateResult] = useState<CreateResult | null>(null)
  const [publicKey, setPublicKey] = useState<[Hex, Hex] | null>(null)
  const [senderAddress, setSenderAddress] = useState<Hex | null>(null)
  const [userOp, setUserOp] = useState<UserOperation | null>(null)
  const [userOpHash, setUserOpHash] = useState<Hex | null>(null)
  const [challenge, setChallenge] = useState<Hex | null>(null)
  const [signature, setSignature] = useState<Uint8Array | null>(null)
  const [sendResult, setSendResult] = useState<boolean | null>(null)

  async function createAccount() {
    const result = await createPasskey({
      domain: window.location.hostname,
      challengeB64: window.btoa('foobar'),
      passkeyName: accountName,
      passkeyDisplayTitle: `Send App: ${accountName}`,
    })
    console.log('Onboarding screen create', result)
    setCreateResult(result)
    const _publicKey = derKeytoContractFriendlyKey(parseCreateResponse(result))
    setPublicKey(_publicKey)

    // await createAccountUsingEOA(_publicKey)

    const { userOp: _userOp, userOpHash: _userOpHash } = await generateUserOp(_publicKey)

    // generate challenge
    const _challenge = generateChallenge(_userOpHash)

    setSenderAddress(_userOp.sender)
    setUserOp(_userOp)
    setUserOpHash(_userOpHash)
    setChallenge(_challenge)
  }

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
        <H2>Start by creating a Passkey below</H2>
        <Label htmlFor="accountName">Account name:</Label>
        <Input id="accountName" onChangeText={setAccountName} value={accountName} />
        <Button onPress={createAccount}>Create</Button>
        <Label htmlFor="publicKey">Your DER public key:</Label>
        <TextArea
          id="publicKey"
          height="$16"
          // @ts-expect-error setup monospace font
          fontFamily={'monospace'}
          value={publicKey ? JSON.stringify(publicKey, null, 2) : undefined}
        />
        <Label htmlFor="senderAddress">Your sender address:</Label>
        <TextArea
          id="senderAddress"
          height="$6"
          // @ts-expect-error setup monospace font
          fontFamily={'monospace'}
          value={senderAddress ? senderAddress : undefined}
        />
        <Label htmlFor="userOpHash">Your userOp hash:</Label>
        <TextArea
          id="userOpHash"
          height="$6"
          // @ts-expect-error setup monospace font
          fontFamily={'monospace'}
          value={userOpHash ? userOpHash : undefined}
        />
        <Label htmlFor="createResult">Create result:</Label>
        <TextArea
          id="createResult"
          height="$16"
          // @ts-expect-error setup monospace font
          fontFamily={'monospace'}
          value={createResult ? JSON.stringify(createResult, null, 2) : undefined}
        />
        <H2>Then sign ther userOpHash with it</H2>
        <Button onPress={_signWithPasskey}>Sign</Button>
        <Label htmlFor="signResult">Sign result:</Label>
        <TextArea
          id="signResult"
          height="$6"
          // @ts-expect-error setup monospace font
          fontFamily={'monospace'}
          value={
            signature && signature?.byteLength > 0
              ? `0x${Buffer.from(signature).toString('hex')}`
              : undefined
          }
        />
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
