/**
 * Onboarding screen will ultimately be the first screen a user sees when they open the app or after they sign up.
 *
 * It needs to:
 * - Introduce to Send
 * - Create a passkey
 * - Generate a deterministic address from the public key
 * - Ask the user to deposit funds
 */
import {
  type CreateResult,
  type SignResult,
  createPasskey,
  signWithPasskey,
} from '@daimo/expo-passkeys'
import { Button, Container, H1, H2, Input, Label, TextArea, YStack } from '@my/ui'
import {
  derKeytoContractFriendlyKey,
  parseAndNormalizeSig,
  parseCreateResponse,
  parseSignResponse,
} from 'app/utils/passkeys'
import React, { useState } from 'react'
import {
  bytesToHex,
  concat,
  encodeFunctionData,
  getContract,
  Hex,
  hexToBytes,
  getAbiItem,
  encodeAbiParameters,
  hexToBigInt,
  createTestClient,
  parseEther,
  http,
  createWalletClient,
  numberToBytes,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
} from 'viem'
import { baseMainnetClient, baseMainnetBundlerClient as bundlerClient } from 'app/utils/viem/client'
import { daimoAccountABI, daimoAccountFactoryABI, iEntryPointABI } from '@my/wagmi'
import { UserOperation, getSenderAddress } from 'permissionless'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { base64urlnopad } from '@scure/base'

const privateKey = generatePrivateKey()
const dummyAccount = privateKeyToAccount(privateKey)
const receiverAccount = privateKeyToAccount(generatePrivateKey())
console.log('receiverAccount.address', receiverAccount.address)
const walletClient = createWalletClient({
  chain: baseMainnetClient.chain,
  transport: http(baseMainnetClient.transport.url),
  account: dummyAccount,
})

const testClient = createTestClient({
  chain: baseMainnetClient.chain,
  transport: http(baseMainnetClient.transport.url),
  mode: 'anvil',
})

const daimoAccountFactoryAddress = '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82'

const daimoAccountFactory = getContract({
  abi: daimoAccountFactoryABI,
  publicClient: baseMainnetClient,
  address: daimoAccountFactoryAddress,
})

const entrypoint = getContract({
  abi: [getAbiItem({ abi: iEntryPointABI, name: 'getUserOpHash' })],
  publicClient: baseMainnetClient,
  address: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
})

// DaimoAccountFactory.createAccount arguments
const VERSION = 1
const VALID_UNTIL = 0
const KEY_SLOT = 0
const SALT = 0n

export function OnboardingScreen() {
  const [accountName, setAccountName] = useState<string>(`Sender ${new Date().toLocaleString()}.0`)
  const [createResult, setCreateResult] = useState<CreateResult | null>(null)
  const [publicKey, setPublicKey] = useState<[Hex, Hex] | null>(null)
  const [senderAddress, setSenderAddress] = useState<Hex | null>(null)
  const [userOp, setUserOp] = useState<UserOperation | null>(null)
  const [userOpHash, setUserOpHash] = useState<Hex | null>(null)
  const [challenge, setChallenge] = useState<Hex | null>(null)
  const [signature, setSignature] = useState<Uint8Array | null>(null)

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

    await createAccountUsingEOA(_publicKey)

    const { userOp: _userOp, userOpHash: _userOpHash } = await generateUserOp(_publicKey)

    // generate challenge
    const _challenge = generateChallenge(_userOpHash)

    setSenderAddress(_userOp.sender)
    setUserOp(_userOp)
    setUserOpHash(_userOpHash)
    setChallenge(_challenge)
    console.log('senderAddress', _userOp.sender)
    console.log('userOp', _userOp)
    console.log('userOpHash', _userOpHash)
    console.log('challenge', _challenge)
  }

  async function _signWithPasskey() {
    if (!challenge || challenge.length <= 0) {
      throw new Error('No challenge')
    }
    if (!userOpHash) {
      throw new Error('No userOpHash')
    }
    const encodedWebAuthnSig = await signChallenge(challenge)
    console.log('encodedWebAuthnSig', encodedWebAuthnSig)
    if (!encodedWebAuthnSig || encodedWebAuthnSig.length <= 2) {
      throw new Error('No encodedWebAuthnSig')
    }
    const _signature = concat([
      numberToBytes(VERSION, { size: 1 }),
      numberToBytes(VALID_UNTIL, { size: 6 }),
      numberToBytes(KEY_SLOT, { size: 1 }),
      hexToBytes(userOpHash),
      hexToBytes(encodedWebAuthnSig),
    ])
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
          height="$20"
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
            await sendUserOp({ userOp, userOpHash, signature, senderAddress })
          }}
        >
          Send
        </Button>
      </YStack>
    </Container>
  )
}

async function sendUserOp({
  userOp,
  userOpHash,
  signature,
  senderAddress,
}: {
  userOp: UserOperation
  userOpHash: Hex
  signature: Uint8Array
  senderAddress: Hex
}) {
  console.log('sending', { userOp, userOpHash, signature })

  // FIXME: sponsor the creation by setting the balance using anvil
  await testClient.setBalance({
    address: senderAddress,
    value: parseEther('10'),
  })

  // FIXME: sponsor the creation by setting the balance using anvil
  await testClient.setBalance({
    address: dummyAccount.address,
    value: parseEther('10'),
  })

  // FIXME: sponsor the creation by setting the deposit on the Entry Point
  const { request: depositRequest } = await baseMainnetClient.simulateContract({
    address: entrypoint.address,
    functionName: 'depositTo',
    abi: iEntryPointABI,
    args: [senderAddress],
    account: dummyAccount,
    value: parseEther('0.5'),
  })
  const depositHash = await walletClient.writeContract(depositRequest)
  const depositReceipt = await baseMainnetClient.waitForTransactionReceipt({ hash: depositHash })
  console.log('depositReceipt', depositReceipt)

  if (depositReceipt.status !== 'success') {
    throw new Error('Failed to deposit')
  }

  const _userOp: UserOperation = {
    ...userOp,
    signature: bytesToHex(signature),
  }

  console.log('sending userOp', _userOp)

  // verify hash is same
  if (userOpHash !== (await entrypoint.read.getUserOpHash([_userOp]))) {
    throw new Error('Hash mismatch')
  }

  // TODO: handle error correctly, simulateValidation always reverts
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
      if (cause.data?.errorName !== 'ValidationResult') {
        throw e
      }
      const validationResult = cause.data.args?.[0]
      console.log('Validation result:', validationResult)
    })

  const hash = await bundlerClient.sendUserOperation({
    userOperation: _userOp,
    entryPoint: entrypoint.address,
  })

  console.log('hash', hash)

  const receipt = await bundlerClient.waitForUserOperationReceipt({ hash })

  console.log('receipt', receipt)

  if (receipt.success !== true) {
    throw new Error('Failed to send userOp')
  }
}

async function signChallenge(challenge: Hex) {
  if (!challenge || challenge.length <= 0) {
    throw new Error('No challenge to sign')
  }
  console.log('Onbboarding screen signing', challenge)
  const challengeBytes = hexToBytes(challenge)
  console.log('Onbboarding screen signing bytes', challengeBytes)
  const challengeB64 = Buffer.from(challengeBytes).toString('base64')
  console.log('Onbboarding screen signing B64', challengeB64)
  if (!challengeB64) {
    throw new Error('No challengeB64 to sign')
  }
  const sign = await signWithPasskey({
    domain: window.location.hostname,
    challengeB64,
  })
  console.log('Onbboarding screen signed', sign)
  const _signResult = parseSignResponse(sign)
  console.log('Onbboarding screen sign result', _signResult)

  const clientDataJSON = _signResult.clientDataJSON
  const clientDataChallenge = JSON.parse(clientDataJSON).challenge
  // const clientDataChallengeBytes = base64urlnopad.decode(clientDataChallenge)
  console.log('clientDataChallenge', clientDataChallenge)
  // console.log('clientDataChallengeBytes', clientDataChallengeBytes)

  // if (Buffer.compare(clientDataChallengeBytes, challengeBytes) !== 0) {
  //   throw new Error('Challenge mismatch')
  // }

  const authenticatorData = bytesToHex(_signResult.rawAuthenticatorData)
  const challengeLocation = BigInt(clientDataJSON.indexOf('"challenge":'))
  const responseTypeLocation = BigInt(clientDataJSON.indexOf('"type":'))
  const { r, s } = parseAndNormalizeSig(_signResult.derSig)
  const webauthnSig = {
    authenticatorData,
    clientDataJSON,
    challengeLocation,
    responseTypeLocation,
    r,
    s,
  }
  console.log('onboarding sig', {
    authenticatorData,
    clientDataJSON,
    challengeLocation,
    responseTypeLocation,
    r: `0x${r.toString(16)}`,
    s: `0x${s.toString(16)}`,
  })
  const encodedWebAuthnSig = encodeAbiParameters(
    getAbiItem({
      abi: daimoAccountABI,
      name: 'signatureStruct',
    }).inputs,
    [webauthnSig]
  )
  console.log('encodedWebAuthnSig', encodedWebAuthnSig)
  return encodedWebAuthnSig
}

function generateChallenge(_userOpHash: Hex): Hex {
  const version = numberToBytes(VERSION, { size: 1 })
  const validUntil = numberToBytes(VALID_UNTIL, { size: 6 })
  const opHash = hexToBytes(_userOpHash)
  const challenge = bytesToHex(concat([version, validUntil, opHash]))
  return challenge
}

async function generateUserOp(publicKey: [Hex, Hex]) {
  const initCode = concat([daimoAccountFactoryAddress, encodeCreateAccountData(publicKey)])

  const senderAddress = await getSenderAddress(baseMainnetClient, {
    initCode,
    entryPoint: entrypoint.address,
  })

  const address = await daimoAccountFactory.read.getAddress([KEY_SLOT, publicKey, [], SALT])

  if (address !== senderAddress) {
    throw new Error('Address mismatch')
  }

  // GENERATE THE CALLDATA
  // Finally, we should be able to do a userop from our new Daimo account.
  const to = receiverAccount.address
  const value = parseEther('0.01')
  const data: Hex = '0x68656c6c6f' // "hello" encoded to utf-8 bytes

  const callData = encodeFunctionData({
    abi: daimoAccountABI,
    functionName: 'executeBatch',
    args: [
      [
        {
          dest: to,
          value: value,
          data: data,
        },
      ],
    ],
  })
  const userOp: UserOperation = {
    sender: senderAddress,
    nonce: 0n,
    initCode: '0x', // initCode,
    callData,
    callGasLimit: 300000n,
    verificationGasLimit: 700000n,
    preVerificationGas: 300000n,
    maxFeePerGas: 1000000n,
    maxPriorityFeePerGas: 1000000n,
    paymasterAndData: '0x',
    signature: '0x',
  }

  // get userop hash
  const userOpHash = await entrypoint.read.getUserOpHash([userOp])

  return {
    userOp,
    userOpHash,
  }
}

function encodeCreateAccountData(publicKey: [Hex, Hex]): Hex {
  return encodeFunctionData({
    abi: [getAbiItem({ abi: daimoAccountFactoryABI, name: 'createAccount' })],
    args: [
      KEY_SLOT, // key slot
      publicKey, // public key
      [], // init calls
      SALT, // salt
    ],
  })
}

/**
 * TODO: use an EOA to create the account for now, this will need to changed to use the init code
 */
async function createAccountUsingEOA(pubKey: [Hex, Hex]) {
  await testClient.setBalance({
    address: dummyAccount.address,
    value: parseEther('1'),
  })

  const { request } = await baseMainnetClient.simulateContract({
    address: daimoAccountFactory.address,
    functionName: 'createAccount',
    abi: daimoAccountFactory.abi,
    args: [KEY_SLOT, pubKey, [], SALT],
    account: dummyAccount,
  })

  const hash = await walletClient.writeContract(request)

  const receipt = await baseMainnetClient.waitForTransactionReceipt({ hash, confirmations: 3 })

  console.log('createAccountUsingEOA receipt', receipt)

  if (receipt.status !== 'success') {
    throw new Error('Failed to create account')
  }

  return receipt
}
