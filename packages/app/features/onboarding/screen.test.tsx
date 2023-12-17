import { expect, test } from '@jest/globals'
import { render } from '@testing-library/react-native'
import { OnboardingScreen } from './screen'
import { TamaguiProvider, config } from '@my/ui'
import type { CreateResult, SignResult } from '@daimo/expo-passkeys'

import debug from 'debug'

const log = debug('app:features:onboarding:screen')

jest.mock('@daimo/expo-passkeys', () => ({
  createPasskey: jest.fn(),
  signWithPasskey: jest.fn(),
}))

test(OnboardingScreen.name, () => {
  const tree = render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <OnboardingScreen />
    </TamaguiProvider>
  ).toJSON()
  expect(tree).toMatchSnapshot()
})

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { getContract, createWalletClient, http, createTestClient, parseEther } from 'viem'
import { baseMainnetClient } from 'app/utils/viem/client'
import { daimoAccountFactoryABI } from '@my/wagmi'

test('can create a new account', async () => {
  // cast call 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 "getAddress(uint8,bytes32[2],(address,uint256,bytes)[],uint256)" 0 "[0xfbe0c37146963dc048d6c4eed22eee64c123535455fa37efdb66491afb1ea658,0xb485d4790597fedeece554aab85bb85dbbe33a93649769c862b59f6a8dbfed74]" "" "0" --rpc-url https://base.rpc.localhost
  const daimoAccountFactoryAddress = '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82'

  const daimoAccountFactory = getContract({
    abi: daimoAccountFactoryABI,
    publicClient: baseMainnetClient,
    address: daimoAccountFactoryAddress,
  })

  expect(daimoAccountFactory).toBeDefined()

  const address = await daimoAccountFactory.read.getAddress([
    0,
    [
      '0xfbe0c37146963dc048d6c4eed22eee64c123535455fa37efdb66491afb1ea658',
      '0xb485d4790597fedeece554aab85bb85dbbe33a93649769c862b59f6a8dbfed74',
    ],
    [],
    0n,
  ])
  expect(address).toBeDefined()
  expect(address).toEqual('0x05F8Ce8f747365b3b53e5C8f4cFe50c3F53BEb99')

  const privateKey = generatePrivateKey()
  const dummyAccount = privateKeyToAccount(privateKey)

  // TODO: this will have to be a userop after user transfers funds to the account, for now, assume we sponsor the creation
  log('setting balance', dummyAccount.address)
  createTestClient({
    chain: baseMainnetClient.chain,
    transport: http(baseMainnetClient.transport.url),
    account: dummyAccount,
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

  const result = await walletClient.writeContract(request)

  log('result', result)
  expect(result).toBeDefined()
})
