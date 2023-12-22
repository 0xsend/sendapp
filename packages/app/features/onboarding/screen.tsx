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
} from 'app/utils/passkeys'
import React, { useEffect, useState } from 'react'
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
} from 'viem'
import { baseMainnetClient, baseMainnetBundlerClient as bundlerClient } from 'app/utils/viem/client'
import { daimoAccountABI, daimoAccountFactoryABI, iEntryPointABI } from '@my/wagmi'
import { UserOperation, getSenderAddress } from 'permissionless'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

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

const VERSION = 1
const VALID_UNTIL = 60
const KEY_SLOT = 0n

/**
 * TODO: use an EOA to create the account for now, this will need to changed to use the init code
 */
async function createAccountUsingEOA(pubKey: [Hex, Hex]) {
  const privateKey = generatePrivateKey()
  const dummyAccount = privateKeyToAccount(privateKey)
  await testClient.setBalance({
    address: dummyAccount.address,
    value: parseEther('1'),
  })
  const walletClient = createWalletClient({
    chain: baseMainnetClient.chain,
    transport: http(baseMainnetClient.transport.url),
    account: dummyAccount,
  })

  const { request } = await baseMainnetClient.simulateContract({
    address: daimoAccountFactory.address,
    functionName: 'createAccount',
    abi: daimoAccountFactory.abi,
    args: [0, pubKey, [], KEY_SLOT],
    account: dummyAccount,
  })

  const hash = await walletClient.writeContract(request)

  return await baseMainnetClient.waitForTransactionReceipt({ hash })
}

export function OnboardingScreen() {
  const [accountName, setAccountName] = useState<string>(`Sender ${new Date().toLocaleString()}`)
  const [createResult, setCreateResult] = useState<CreateResult | null>(null)
  const [signResult, setSignResult] = useState<SignResult | null>(null)
  const [publicKey, setPublicKey] = useState<[Hex, Hex] | null>(null)
  const [senderAddress, setSenderAddress] = useState<Hex | null>(null)
  const [userOp, setUserOp] = useState<UserOperation | null>(null)
  const [userOpHash, setUserOpHash] = useState<Hex | null>(null)
  const [challenge, setChallenge] = useState<Hex | null>(null)
  const [rS, setRS] = useState<[Hex, Hex] | null>(null) // [r, s]

  async function createAccount() {
    const result = await createPasskey({
      domain: window.location.hostname,
      challengeB64: window.btoa('foobar'),
      passkeyName: accountName,
      passkeyDisplayTitle: `Send App: ${accountName}`,
    })
    console.log('Onboarding screen create', result)
    setCreateResult(result)
    setPublicKey(derKeytoContractFriendlyKey(parseCreateResponse(result)))
  }

  async function _signWithPasskey() {
    if (!challenge) {
      throw new Error('No challenge to sign')
    }
    const sign = await signWithPasskey({
      domain: window.location.hostname,
      challengeB64: Buffer.from(challenge, 'hex').toString('base64'),
    })
    console.log('Onbboarding screen sign', sign)
    setSignResult(sign)
  }

  async function sendUserOp() {
    console.log('sending', { userOp, userOpHash, rS, signResult })

    if (!publicKey) {
      throw new Error('No public key')
    }

    if (!senderAddress) {
      throw new Error('No sender address')
    }

    if (!userOp || !userOpHash) {
      throw new Error('No userOp')
    }

    if (!rS) {
      throw new Error('No signature')
    }

    if (!signResult) {
      throw new Error('No sign result')
    }

    // TODO: sponsor the creation by setting the balance using anvil
    // await testClient.setBalance({
    //   address: senderAddress,
    //   value: parseEther('1'),
    // })

    await createAccountUsingEOA(publicKey)

    const authenticatorData = bytesToHex(Buffer.from(signResult?.rawAuthenticatorDataB64, 'base64'))
    const clientDataJSON = Buffer.from(signResult?.rawClientDataJSONB64, 'base64').toString('utf-8')
    const challengeLocation = BigInt(clientDataJSON.indexOf('"challenge":'))
    const responseTypeLocation = BigInt(clientDataJSON.indexOf('"type":'))
    console.log({
      challengeLocation,
      responseTypeLocation,
    })
    const webauthnSig = {
      authenticatorData,
      clientDataJSON,
      challengeLocation,
      responseTypeLocation,
      r: hexToBigInt(rS[0]),
      s: hexToBigInt(rS[1]),
    }
    console.log('onboarding sig', webauthnSig)
    const encodedWebAuthnSig = encodeAbiParameters(
      getAbiItem({
        abi: daimoAccountABI,
        name: 'signatureStruct',
      }).inputs,
      [webauthnSig]
    )

    const signature = concat([
      numberToBytes(VERSION, { size: 1 }),
      numberToBytes(VALID_UNTIL, { size: 6 }),
      numberToBytes(KEY_SLOT, { size: 1 }),
      hexToBytes(userOpHash),
      hexToBytes(encodedWebAuthnSig),
    ])

    const _userOp: UserOperation = {
      ...userOp,
      signature: bytesToHex(signature),
    }

    console.log('sending userOp', _userOp)

    // verify hash is same
    if (userOpHash !== (await entrypoint.read.getUserOpHash([_userOp]))) {
      throw new Error('Hash mismatch')
    }

    const hash = await bundlerClient.sendUserOperation({
      userOperation: _userOp,
      entryPoint: entrypoint.address,
    })

    console.log('hash', hash)

    const receipt = await bundlerClient.waitForUserOperationReceipt({ hash })

    console.log('receipt', receipt)
  }

  // generate challenge
  useEffect(() => {
    if (!publicKey) {
      return
    }
    if (publicKey.length !== 2) {
      throw new Error('Invalid public key')
    }
    void (async () => {
      const { userOp: _userOp, userOpHash: _userOpHash } = await generateUserOp(publicKey)

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
    })()
  }, [publicKey])

  // process sign result to get r and s
  useEffect(() => {
    if (!signResult) {
      return
    }

    const { signatureB64 } = signResult
    const signatureBytes = Buffer.from(signatureB64, 'base64')
    const signatureHex = bytesToHex(signatureBytes)
    const { r, s } = parseAndNormalizeSig(signatureHex)
    setRS([`0x${r.toString(16)}`, `0x${s.toString(16)}`])
  }, [signResult])

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
          value={signResult ? JSON.stringify(signResult, null, 2) : undefined}
        />
        <Label htmlFor="signature">R and S:</Label>
        <TextArea
          id="rS"
          height="$20"
          // @ts-expect-error setup monospace font
          fontFamily={'monospace'}
          value={rS ? JSON.stringify(rS, null, 2) : undefined}
        />
        <H2>Send it</H2>
        <Button onPress={sendUserOp}>Send</Button>
      </YStack>
    </Container>
  )
}

function generateChallenge(_userOpHash: Hex): Hex {
  const version = numberToBytes(VERSION, { size: 1 })
  const validUntil = numberToBytes(VALID_UNTIL, { size: 6 })
  const opHash = hexToBytes(_userOpHash)
  const challenge = bytesToHex(concat([version, validUntil, opHash]))
  return challenge
}

async function generateUserOp(publicKey: [Hex, Hex]) {
  const initCode = concat([
    daimoAccountFactoryAddress,
    encodeFunctionData({
      abi: [getAbiItem({ abi: daimoAccountFactoryABI, name: 'createAccount' })],
      args: [0, publicKey, [], KEY_SLOT],
    }),
  ])

  const senderAddress = await getSenderAddress(baseMainnetClient, {
    initCode,
    entryPoint: entrypoint.address,
  })

  const address = await daimoAccountFactory.read.getAddress([0, publicKey, [], KEY_SLOT])

  if (address !== senderAddress) {
    throw new Error('Address mismatch')
  }

  // GENERATE THE CALLDATA
  const to = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' // vitalik
  const value = 0n
  const data = '0x68656c6c6f' // "hello" encoded to utf-8 bytes

  const callData = encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: 'dest', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'func', type: 'bytes' },
        ],
        name: 'execute',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    args: [to, value, data],
  })

  const _userOp: UserOperation = {
    sender: senderAddress,
    nonce: 0n,
    initCode: '0x',
    callData,
    callGasLimit: 300000n,
    verificationGasLimit: 700000n,
    preVerificationGas: 300000n,
    maxFeePerGas: 1000000n,
    maxPriorityFeePerGas: 100000050n,
    paymasterAndData: '0x',
    signature: '0x',
  }

  // get userop hash
  const userOpHash = await entrypoint.read.getUserOpHash([_userOp])

  return {
    userOp: _userOp,
    userOpHash,
  }
}
