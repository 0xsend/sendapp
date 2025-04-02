import { defineConfig } from '@wagmi/cli'
import { react, actions, foundry } from '@wagmi/cli/plugins'
import { pascalCase } from 'change-case'
import { globby } from 'globby'
import { erc20Abi, multicall3Abi } from 'viem'
import { base, baseSepolia, mainnet, sepolia } from 'viem/chains'
import { localhost, baseLocal } from './src/chains'
import { iEntryPointAbi } from './src'

import sendTokenUpgradeBaseLocalAddresses from '@0xsend/send-token-upgrade/ignition/deployments/chain-845337/deployed_addresses.json' with {
  type: 'json',
}

import sendTokenUpgradeBaseSepoliaAddresses from '@0xsend/send-token-upgrade/ignition/deployments/chain-84532/deployed_addresses.json' with {
  type: 'json',
}

import sendTokenV0LockboxArtifact from '@0xsend/send-token-upgrade/artifacts/contracts/SendLockbox.sol/SendLockbox.json' with {
  type: 'json',
}
import sendTokenV1Artifact from '@0xsend/send-token-upgrade/artifacts/contracts/SendToken.sol/SendToken.json' with {
  type: 'json',
}

const broadcasts = (
  await globby([`${process.cwd()}/../contracts/broadcast/**/run-latest.json`])
).filter((f) => !f.includes('dry-run'))

if (!broadcasts.length) throw new Error('No broadcasts found.')

const deployments = await broadcasts.reduce(async (accP, file) => {
  const acc = await accP
  const data = await import(file, {
    assert: { type: 'json' },
  })
  if (!data?.default) throw new Error(`No data found in ${file}`)
  const { chain, transactions } = data.default as {
    chain: string
    transactions: { contractName: string; contractAddress: string; transactionType: string }[]
  }

  transactions
    .filter((tx) => {
      if (!tx.transactionType) throw new Error(`No transactionType found in ${file}`)
      return tx.transactionType === 'CREATE2'
    })
    .map((tx) => {
      const { contractAddress, contractName } = tx
      if (!contractName) throw new Error(`No contractName found in ${file}`)
      if (!contractAddress) throw new Error(`No contractAddress found in ${file}`)
      console.log('Processing', { file, contractName, contractAddress, chain })
      acc[contractName] = {
        ...acc[contractName],
        [chain]: contractAddress,
      }
    })

  return acc
}, Promise.resolve({}))

// if deployment has base.id set, use for the baseLocal.id chain
const ignoreHardcodeContracts = [
  'SendVerifyingPaymaster', // need to override since we use a test private key for the verifier
]
for (const [contract, addresses] of Object.entries(deployments) as [
  string,
  Record<number, string>,
][]) {
  const baseAddress = addresses[base.id]
  if (baseAddress && !ignoreHardcodeContracts.includes(contract)) {
    console.log('using', base.id, 'for', contract, 'as local fork')
    addresses[baseLocal.id] = baseAddress
    deployments[contract] = addresses
  }
}

console.log({ deployments })

// @ts-expect-error it's parsed JSON
const deployedSendMerkleDrop = deployments.SendMerkleDrop
if (!deployedSendMerkleDrop) throw new Error('No SendMerkleDrop found.')

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
    /**
     * [Send: Revenue](https://basescan.org/address/0x71fa02bb11e4b119bEDbeeD2f119F62048245301)
     **/
    {
      name: 'SendRevenueSafe',
      address: {
        [baseLocal.id]: '0x71fa02bb11e4b119bEDbeeD2f119F62048245301',
        [base.id]: '0x71fa02bb11e4b119bEDbeeD2f119F62048245301',
        [baseSepolia.id]: '0x269cD0a2afd1BAbdA7A74ab1dC853869a37aa4a7',
      },
      abi: [],
    },
    /**
     * [Send: Swaps Revenue](https://basescan.org/address/0x17D46f667B0e4156238645536c344d010FC099d7)
     **/
    {
      name: 'SendSwapsRevenueSafe',
      address: {
        [baseLocal.id]: '0x17D46f667B0e4156238645536c344d010FC099d7',
        [base.id]: '0x17D46f667B0e4156238645536c344d010FC099d7',
      },
      abi: [],
    },
    {
      /**
       * [Send: Treasury](https://basescan.org/address/0x05CEa6C36f3a44944A4F4bA39B1820677AcB97EE)
       **/
      name: 'SendTreasurySafe',
      address: '0x05CEa6C36f3a44944A4F4bA39B1820677AcB97EE',
      abi: [],
    },
    {
      /**
       * [Send: Airdrops](https://basescan.org/address/0x077c4E5983e5c495599C1Eb5c1511A52C538eB50)
       **/
      name: 'SendAirdropsSafe',
      address: '0x077c4E5983e5c495599C1Eb5c1511A52C538eB50',
      abi: [],
    },
    {
      /**
       * [UniswapV3Pool: send](https://basescan.org/address/0xa1b2457c0b627f97f6cc892946a382451e979014)
       **/
      name: 'SendUniswapV3Pool',
      address: '0xa1b2457c0b627f97f6cc892946a382451e979014',
      abi: [],
    },
    {
      name: 'USDC',
      address: {
        [mainnet.id]: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // mainnet
        [localhost.id]: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // mainnet localhost fork
        [sepolia.id]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // sepolia
        [baseLocal.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', //  base mainnet fork
        [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // base mainnet
        [baseSepolia.id]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // base sepolia
      },
      abi: erc20Abi,
    },
    {
      name: 'SPX6900',
      address: {
        [mainnet.id]: '0xe0f63a424a4439cbe457d80e4f4b51ad25b2c56c', // mainnet
        [localhost.id]: '0xe0f63a424a4439cbe457d80e4f4b51ad25b2c56c', // mainnet localhost fork
        [sepolia.id]: '0xe0f63a424a4439cbe457d80e4f4b51ad25b2c56c', // sepolia
        [baseLocal.id]: '0x50dA645f148798F68EF2d7dB7C1CB22A6819bb2C', //  base mainnet fork
        [base.id]: '0x50dA645f148798F68EF2d7dB7C1CB22A6819bb2C', // base mainnet
        [baseSepolia.id]: '0x50dA645f148798F68EF2d7dB7C1CB22A6819bb2C', // base sepolia
      },
      abi: erc20Abi,
    },
    {
      name: 'Moonwell', // TODO is this available on eth?
      address: {
        [baseLocal.id]: '0xa88594d404727625a9437c3f886c7643872296ae',
        [base.id]: '0xa88594d404727625a9437c3f886c7643872296ae',
        [baseSepolia.id]: '0xa88594d404727625a9437c3f886c7643872296ae', // TODO is this available on base sepolia?
      },
      abi: erc20Abi,
    },
    {
      name: 'Morpho',
      address: {
        [mainnet.id]: '0x58d97b57bb95320f9a05dc918aef65434969c2b2',
        [localhost.id]: '0x58d97b57bb95320f9a05dc918aef65434969c2b2',
        [sepolia.id]: '0x58d97b57bb95320f9a05dc918aef65434969c2b2', // TODO is this available on eth sepolia?
        [base.id]: '0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842',
        [baseLocal.id]: '0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842',
        [baseSepolia.id]: '0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842', // TODO is this available on base sepolia?
      },
      abi: erc20Abi,
    },
    {
      name: 'Aerodrome Finance', // TODO is this available on eth?
      address: {
        [base.id]: '0x940181a94a35a4569e4529a3cdfb74e38fd98631',
        [baseLocal.id]: '0x940181a94a35a4569e4529a3cdfb74e38fd98631',
        [baseSepolia.id]: '0x940181a94a35a4569e4529a3cdfb74e38fd98631', // TODO is this available on base sepolia?
      },
      abi: erc20Abi,
    },
    {
      name: 'Coinbase Wrapped BTC',
      address: {
        [mainnet.id]: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
        [localhost.id]: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
        [sepolia.id]: '0xcbb7c0006f23900c38eb856149f799620fcb8a4a',
        [base.id]: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
        [baseLocal.id]: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
        [baseSepolia.id]: '0x08e53b71490e00e8dc1c0367f97ba053567a547e',
      },
      abi: erc20Abi,
    },
    {
      name: 'EntryPoint',
      address: {
        [mainnet.id]: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
        [localhost.id]: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
        [sepolia.id]: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
        [baseLocal.id]: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
        [base.id]: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
        [baseSepolia.id]: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      },
      abi: iEntryPointAbi,
    },
    {
      name: 'Multicall3',
      address: {
        [mainnet.id]: '0xcA11bde05977b3631167028862bE2a173976CA11',
        [localhost.id]: '0xcA11bde05977b3631167028862bE2a173976CA11',
        [sepolia.id]: '0xcA11bde05977b3631167028862bE2a173976CA11',
        [baseLocal.id]: '0xcA11bde05977b3631167028862bE2a173976CA11',
        [base.id]: '0xcA11bde05977b3631167028862bE2a173976CA11',
        [baseSepolia.id]: '0xcA11bde05977b3631167028862bE2a173976CA11',
      },
      abi: multicall3Abi,
    },
    {
      // SendTokenModule#SendToken
      name: 'SendTokenV0Lockbox',
      // @ts-expect-error doesn't like the artifact
      abi: sendTokenV0LockboxArtifact.abi,
      address: {
        [base.id]: sendTokenUpgradeBaseLocalAddresses[
          'SendTokenModule#SendLockbox'
        ] as `0x${string}`,
        [baseLocal.id]: sendTokenUpgradeBaseLocalAddresses[
          'SendTokenModule#SendLockbox'
        ] as `0x${string}`,
        [baseSepolia.id]: sendTokenUpgradeBaseSepoliaAddresses[
          'SendTokenModule#SendLockbox'
        ] as `0x${string}`,

        // we probably don't need these
        // [localhost.id]: sendTokenUpgradeAddresses['SendTokenModule#SendLockbox'] as `0x${string}`,
        // [sepolia.id]: sendTokenUpgradeAddresses['SendTokenModule#SendLockbox'] as `0x${string}`,
      },
    },
    {
      // SendTokenModule#SendLockbox
      name: 'SendToken',
      // @ts-expect-error doesn't like the artifact
      abi: sendTokenV1Artifact.abi,
      address: {
        [base.id]: sendTokenUpgradeBaseLocalAddresses['SendTokenModule#SendToken'] as `0x${string}`,
        [baseLocal.id]: sendTokenUpgradeBaseLocalAddresses[
          'SendTokenModule#SendToken'
        ] as `0x${string}`,
        [baseSepolia.id]: sendTokenUpgradeBaseSepoliaAddresses[
          'SendTokenModule#SendToken'
        ] as `0x${string}`,

        // we probably don't need these
        // [localhost.id]: sendTokenUpgradeAddresses['SendTokenModule#SendToken'] as `0x${string}`,
        // [sepolia.id]: sendTokenUpgradeAddresses['SendTokenModule#SendToken'] as `0x${string}`,
      },
    },
  ],
  plugins: [
    foundry({
      project: '../contracts',
      deployments: {
        SendTokenV0: {
          1: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
          [sepolia.id]: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
          1337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
          [base.id]: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A', // base mainnet
          [baseSepolia.id]: '0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680', // base sepolia
          // maybe bring back once bridging is supported https://github.com/base-org/guides/issues/15
          // [baseSepolia.id]: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A', // base sepolia
          845337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A', // base localnet
        },
        ...deployments,
        SendMerkleDrop: {
          1: '0xB9310daE45E71c7a160A13D64204623071a8E347',
          [sepolia.id]: '0xB9310daE45E71c7a160A13D64204623071a8E347',
          1337: '0xB9310daE45E71c7a160A13D64204623071a8E347',
          [base.id]: '0x240761104aF5DAeDFd9025810FfEB741fEB316B3', // base mainnet
          [baseSepolia.id]: '0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE', // base sepolia
          [baseLocal.id]: '0x614F5273FdB63C1E1972fe1457Ce77DF1Ca440A6', // base localnet
          ...deployedSendMerkleDrop,
        },
      },
      include: [
        'Send*.sol/*',
        'ERC*.sol/*',
        'IEntryPoint*.sol/*',
        'EntryPointSimulations.sol/*',
        'TokenPaymaster.sol/*',
      ],
      exclude: [
        'Common.sol/**',
        'Components.sol/**',
        'Script.sol/**',
        'StdAssertions.sol/**',
        'StdInvariant.sol/**',
        'StdError.sol/**',
        'StdCheats.sol/**',
        'StdMath.sol/**',
        'StdJson.sol/**',
        'StdStorage.sol/**',
        'StdUtils.sol/**',
        'Vm.sol/**',
        'console.sol/**',
        'console2.sol/**',
        'test.sol/**',
        '**.s.sol/*.json',
        '**.t.sol/*.json',
        'SendPaymaster.sol/**', // avoid duplicate IMetaPaymaster
        'SendtagCheckout.sol/Address.json',
        'SendtagCheckout.sol/Context.json',
        'SendtagCheckout.sol/IERC20.json',
        'SendtagCheckout.sol/IERC20Permit.json',
        'SendtagCheckout.sol/Ownable.json',
        'SendtagCheckout.sol/SafeERC20.json',
        'DummyEntryPointSimulations.sol/**', // avoid dummies
      ],
    }),
    actions({
      getActionName: (() => {
        const actionNames = new Set<string>()
        return ({ contractName, type, itemName }) => {
          const ContractName = pascalCase(contractName)
          const ItemName = itemName ? pascalCase(itemName) : undefined

          let actionName: string
          if (type === 'simulate') {
            actionName = `prepareWrite${ContractName}${ItemName ?? ''}`
          } else {
            actionName = `${type}${ContractName}${ItemName ?? ''}`
            if (type === 'watch') actionName = `${actionName}Event`
          }

          if (actionNames.has(actionName)) {
            actionName = `_${actionName}`
          }

          actionNames.add(actionName)

          return actionName
        }
      })(),
    }),
    react({
      getHookName: (() => {
        const hookNames = new Set<string>()

        return ({ contractName, type, itemName }) => {
          const ContractName = pascalCase(contractName)
          const ItemName = itemName ? pascalCase(itemName) : undefined

          let hookName = `use${pascalCase(type)}${ContractName}${ItemName ?? ''}`
          if (type === 'watch') hookName = `${hookName}Event`

          if (hookNames.has(hookName)) hookName = `_${hookName}`

          hookNames.add(hookName)
          return hookName as `use${string}`
        }
      })(),
    }),
  ],
})
