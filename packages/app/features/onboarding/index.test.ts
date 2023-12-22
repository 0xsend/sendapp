import { expect, test } from '@jest/globals'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import {
  getContract,
  createWalletClient,
  http,
  createTestClient,
  parseEther,
  concat,
  encodeFunctionData,
} from 'viem'
import { baseMainnetClient, baseMainnetBundlerClient as bundlerClient } from 'app/utils/viem/client'
import { daimoAccountFactoryABI } from '@my/wagmi'
import debug from 'debug'
import { UserOperation, getSenderAddress } from 'permissionless'
export const log = debug('app:features:onboarding:screen')

test('can create a new account', async () => {
  // cast call 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 "getAddress(uint8,bytes32[2],(address,uint256,bytes)[],uint256)" 0 "[0xfbe0c37146963dc048d6c4eed22eee64c123535455fa37efdb66491afb1ea658,0xb485d4790597fedeece554aab85bb85dbbe33a93649769c862b59f6a8dbfed74]" "" "0" --rpc-url https://base.rpc.localhost
  const daimoAccountFactoryAddress = '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82'

  const daimoAccountFactory = getContract({
    abi: daimoAccountFactoryABI,
    publicClient: baseMainnetClient,
    address: daimoAccountFactoryAddress,
  })

  expect(daimoAccountFactory).toBeDefined()

  const initCode = concat([
    daimoAccountFactoryAddress,
    encodeFunctionData({
      // @ts-expect-error viem gets confused by the filter of daimoAccountFactoryABI
      abi: daimoAccountFactoryABI.filter((abi) => 'name' in abi && abi.name === 'createAccount'),
      args: [
        0,
        [
          '0xfbe0c37146963dc048d6c4eed22eee64c123535455fa37efdb66491afb1ea658',
          '0xb485d4790597fedeece554aab85bb85dbbe33a93649769c862b59f6a8dbfed74',
        ],
        [],
        0n,
      ],
    }),
  ])

  log('initCode', initCode)

  const senderAddress = await getSenderAddress(baseMainnetClient, {
    initCode,
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  })

  log('senderAddress', senderAddress)

  const address = await daimoAccountFactory.read.getAddress([
    0,
    [
      '0xfbe0c37146963dc048d6c4eed22eee64c123535455fa37efdb66491afb1ea658',
      '0xb485d4790597fedeece554aab85bb85dbbe33a93649769c862b59f6a8dbfed74',
    ],
    [],
    0n,
  ])

  // expect(address).toEqual(senderAddress)

  expect(address).toBeDefined()
  expect(address).toEqual('0x05F8Ce8f747365b3b53e5C8f4cFe50c3F53BEb99')

  // TODO: this will have to be a userop after user transfers funds to the account, for now, assume we sponsor the creation
  log('setting balance', address)
  await createTestClient({
    chain: baseMainnetClient.chain,
    transport: http(baseMainnetClient.transport.url),
    mode: 'hardhat',
  }).setBalance({
    address: address,
    value: parseEther('1'),
  })

  const privateKey = generatePrivateKey()
  const dummyAccount = privateKeyToAccount(privateKey)

  log('setting balance', dummyAccount.address)
  await createTestClient({
    chain: baseMainnetClient.chain,
    transport: http(baseMainnetClient.transport.url),
    mode: 'anvil',
  }).setBalance({
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
    args: [
      0,
      [
        '0xfbe0c37146963dc048d6c4eed22eee64c123535455fa37efdb66491afb1ea658',
        '0xb485d4790597fedeece554aab85bb85dbbe33a93649769c862b59f6a8dbfed74',
      ],
      [],
      0n,
    ],
    account: dummyAccount,
  })

  const hash = await walletClient.writeContract(request)

  const receipt = await baseMainnetClient.waitForTransactionReceipt({ hash })

  expect(receipt).toBeDefined()
  expect(receipt.status).toEqual('success')
  log('receipt', receipt)

  // send test userop via bundler

  // UserOp signature structure:
  // - uint8 version

  // v1: 1+6+1+(unknown) bytes
  // - uint48 validUntil
  // - uint8 keySlot
  // - bytes (type Signature) signature

  // const userOpHash = await baseMainnetBundlerClient.sendUserOperation({
  //   userOperation: {
  //     sender: '0x0C123D90Da0a640fFE54a2359D159629065775C5',
  //     nonce: 3n,
  //     initCode: '0x',
  //     callData:
  //       '0x18dfb3c7000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000d2f598c826429eee7c071c02735549acd88f2c09000000000000000000000000d2f598c826429eee7c071c02735549acd88f2c090000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000044a9059cbb00000000000000000000000043a4eacb7839f202d9cab465dbdd77d4fabe0a1800000000000000000000000000000000000000000000000003782dace9d90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000982e148216e3aa6b38f9d901ef578b5c06dd750200000000000000000000000000000000000000000000000005d423c655aa000000000000000000000000000000000000000000000000000000000000',
  //     callGasLimit: 50305n,
  //     verificationGasLimit: 80565n,
  //     preVerificationGas: 56135n,
  //     maxFeePerGas: 113000000n,
  //     maxPriorityFeePerGas: 113000100n,
  //     paymasterAndData:
  //       '0xe93eca6595fe94091dc1af46aac2a8b5d79907700000000000000000000000000000000000000000000000000000000065133b6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005d3d07ae8973ba1b8a26d0d72d8882dfa97622942a63c4b655f4928385ce587f6aa2fa1ab347e615d5f39e1214d18f426375da8a01514fb126eb0bb29f0c319d1b',
  //     signature:
  //       '0xf1513a8537a079a4d728bb87099b2c901e2c9034e60c95a4d41ac1ed75d6ee90270d52b48af30aa036e9a205ea008e1c62b317e7b3f88b3f302d45fb1ba76a191b',
  //   },
  //   entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  // })

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

  log('initCode', initCode)
  log('callData', callData)

  /**
   * User Operation struct
   * @param sender the sender account of this request.
   * @param nonce unique value the sender uses to verify it is not a replay.
   * @param initCode if set, the account contract will be created by this constructor/
   * @param callData the method call to execute on this account.
   * @param callGasLimit the gas limit passed to the callData method call.
   * @param verificationGasLimit gas used for validateUserOp and validatePaymasterUserOp.
   * @param preVerificationGas gas not calculated by the handleOps method, but added to the gas paid. Covers batch overhead.
   * @param maxFeePerGas same as EIP-1559 gas parameter.
   * @param maxPriorityFeePerGas same as EIP-1559 gas parameter.
   * @param paymasterAndData if set, this field holds the paymaster address and paymaster-specific data. the paymaster will pay for the transaction instead of the sender.
   * @param signature sender-verified signature over the entire request, the EntryPoint address and the chain ID.
   */
  const userOp: UserOperation = {
    sender: address,
    nonce: 0n,
    initCode,
    callData,
    callGasLimit: 50305n,
    verificationGasLimit: 80565n,
    preVerificationGas: 56135n,
    maxFeePerGas: 113000000n,
    maxPriorityFeePerGas: 113000100n,
    paymasterAndData: '0x',
    signature: '0x',
  }

  // TODO: find a bundler that works for local dev 😢
  // const gasPrice = await bundlerClient.estimateUserOperationGas({
  //   userOperation: userOp,
  //   entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  // })
  // log('gasPrice', gasPrice)

  // const userOpHash = await bundlerClient.sendUserOperation({
  //   userOperation: userOp,
  //   entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  // })
  // log('userOpHash', userOpHash)
}, 10_000)

test('can create a new account with bundler', async () => {
  const supportedEntryPoints = await bundlerClient.supportedEntryPoints()
  console.log('supportedEntryPoints', supportedEntryPoints)
  log('TODO: implement bundler test', supportedEntryPoints)
})

test('can get gas user operation gas prices', async () => {
  const gasPrice = await baseMainnetClient.getGasPrice()
  expect(gasPrice).toBeDefined()
  log('gasPrice', gasPrice)
})
