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
import { Button, Container, H1, H2, Label, TextArea, YStack } from '@my/ui'
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
} from 'viem'
import { baseMainnetClient, baseMainnetBundlerClient as bundlerClient } from 'app/utils/viem/client'
import { daimoAccountFactoryABI, iEntryPointABI } from '@my/wagmi'
import { UserOperation, getSenderAddress } from 'permissionless'

const daimoAccountFactoryAddress = '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82'

const daimoAccountFactory = getContract({
  abi: daimoAccountFactoryABI,
  publicClient: baseMainnetClient,
  address: daimoAccountFactoryAddress,
})

// const onboardingState = {
//   passkeyAddress: null,
// }

// const onboardingContext = React.createContext(onboardingState)

// export function OnboardingProvider({ children }) {
//   return <onboardingContext.Provider value={onboardingState}>{children}</onboardingContext.Provider>
// }

export function OnboardingScreen() {
  const [createResult, setCreateResult] = useState<CreateResult | null>(null)
  const [signResult, setSignResult] = useState<SignResult | null>(null)
  const [publicKey, setPublicKey] = useState<[Hex, Hex] | null>(null)
  const [senderAddress, setSenderAddress] = useState<Hex | null>(null)
  const [userOpHash, setUserOpHash] = useState<Hex | null>(null)

  // lookup account address
  useEffect(() => {
    if (!publicKey) {
      return
    }
    if (publicKey.length !== 2) {
      throw new Error('Invalid public key')
    }
    void (async () => {
      const initCode = concat([
        daimoAccountFactoryAddress,
        encodeFunctionData({
          abi: [getAbiItem({ abi: daimoAccountFactoryABI, name: 'createAccount' })],
          args: [0, publicKey, [], 42n],
        }),
      ])

      const senderAddress = await getSenderAddress(baseMainnetClient, {
        initCode,
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      })

      const address = await daimoAccountFactory.read.getAddress([0, publicKey, [], 42n])

      console.log('address', address)
      setSenderAddress(address)

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

      const userOp: UserOperation = {
        sender: senderAddress,
        nonce: 0n,
        initCode: '0x',
        callData: '0x00',
        callGasLimit: 200000n,
        verificationGasLimit: 2000000n,
        preVerificationGas: 21000n,
        maxFeePerGas: BigInt(3e9),
        maxPriorityFeePerGas: BigInt(1e9),
        paymasterAndData: '0x',
        signature: '0x00',
      }

      const entrypoint = getContract({
        abi: [getAbiItem({ abi: iEntryPointABI, name: 'getUserOpHash' })],
        publicClient: baseMainnetClient,
        address: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      })

      // get userop hash
      const userOpHash = await entrypoint.read.getUserOpHash([userOp])

      console.log('userOpHash', userOpHash)
      setUserOpHash(userOpHash)
    })()
  }, [publicKey])

  // process sign result
  useEffect(() => {
    if (!signResult) {
      return
    }

    const { signatureB64 } = signResult
    const signatureBytes = window.atob(signatureB64)

    // convert to hex
    console.log(signatureBytes)

    const signatureHex = bytesToHex(
      Uint8Array.from([...signatureBytes].map((c) => c.charCodeAt(0)))
    )

    console.log('signatureHex', signatureHex)

    const { r, s } = parseAndNormalizeSig(signatureHex)

    console.log('r', r, r.toString(16))
    console.log('s', s, s.toString(16))
  }, [signResult])

  return (
    <Container>
      <YStack space="$4" maxWidth={600}>
        <H1>Welcome to Send</H1>
        <H2>Start by creating a Passkey below</H2>
        <Button
          onPress={async () => {
            const result = await createPasskey({
              domain: 'sendapp.localhost',
              challengeB64: window.btoa('some challenge'),
              passkeyName: 'sendappuser.1',
              passkeyDisplayTitle: 'SendAppUser',
            })
            console.log('Onboarding screen', result)
            setCreateResult(result)

            setPublicKey(derKeytoContractFriendlyKey(parseCreateResponse(result)))
          }}
        >
          Create
        </Button>
        <Label htmlFor="publicKey">Your DER public key:</Label>
        <TextArea
          id="publicKey"
          height="$16"
          fontFamily={'monospace'}
          value={publicKey ? JSON.stringify(publicKey, null, 2) : undefined}
        />
        <Label htmlFor="senderAddress">Your sender address:</Label>
        <TextArea
          id="senderAddress"
          height="$6"
          fontFamily={'monospace'}
          value={senderAddress ? senderAddress : undefined}
        />
        <Label htmlFor="userOpHash">Your userOp hash:</Label>
        <TextArea
          id="userOpHash"
          height="$6"
          fontFamily={'monospace'}
          value={userOpHash ? userOpHash : undefined}
        />
        <Label htmlFor="createResult">Create result:</Label>
        <TextArea
          id="createResult"
          height="$16"
          fontFamily={'monospace'}
          value={createResult ? JSON.stringify(createResult, null, 2) : undefined}
        />
        <H2>Then sign ther userOpHash with it</H2>
        <Button
          onPress={async () => {
            if (!userOpHash) {
              throw new Error('No userOpHash')
            }
            const bytes = hexToBytes(userOpHash)
            const userOpHashBase64 = window.btoa(String.fromCharCode(...bytes))
            const sign = await signWithPasskey({
              domain: 'sendapp.localhost',
              challengeB64: userOpHashBase64,
            })
            console.log(sign)
            setSignResult(sign)
          }}
        >
          Sign
        </Button>
        <Label htmlFor="signResult">Sign result:</Label>
        <TextArea
          id="signResult"
          height="$20"
          fontFamily={'monospace'}
          value={signResult ? JSON.stringify(signResult, null, 2) : undefined}
        />
      </YStack>
    </Container>
  )
}
