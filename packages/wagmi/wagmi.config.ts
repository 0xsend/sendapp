import { defineConfig } from '@wagmi/cli'
import { react, actions, foundry } from '@wagmi/cli/plugins'
import { pascalCase } from 'change-case'
import { globby } from 'globby'
import { erc20Abi } from 'viem'
import { base, baseSepolia, mainnet } from 'viem/chains'
import { localhost, baseLocal, stagingMainnet } from './src/chains'
import { iEntryPointAbi } from './src'

const broadcasts = await globby([`${process.cwd()}/../contracts/broadcast/**/run-latest.json`])
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

console.log({ deployments })

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
    {
      name: 'SendRevenueSafe',
      address: '0xBB253919a15C5E0C9986d83f205A9279b4247E3d',
      abi: [],
    },
    {
      /**
       * [Send: DEX & CEX Listings](https://etherscan.io/address/0xF530e6E60e7a65Ea717f843a8b2e6fcdC727aC9E)
       **/
      name: 'SendEXListingsSafe',
      address: '0xF530e6E60e7a65Ea717f843a8b2e6fcdC727aC9E',
      abi: [],
    },
    {
      /**
       * [Send: Treasury](https://etherscan.io/address/0x4bB2f4c771ccB60723a78a974a2537AD339071c7)
       **/
      name: 'SendTreasurySafe',
      address: '0x4bB2f4c771ccB60723a78a974a2537AD339071c7',
      abi: [],
    },
    {
      /**
       * [Send: Airdrops](https://etherscan.io/address/0x6204Bc0662ccd8a9A762d59fe7906733f251E3b7)
       **/
      name: 'SendAirdropsSafe',
      address: '0x6204Bc0662ccd8a9A762d59fe7906733f251E3b7',
      abi: [],
    },
    {
      /**
       * [Send: Core Team](https://etherscan.io/address/0xE52D0967A2eE242098d11c209f53C8158E329eCC)
       **/
      name: 'SendCoreTeamSafe',
      address: '0xE52D0967A2eE242098d11c209f53C8158E329eCC',
      abi: [],
    },
    {
      /**
       * [Send: Contributor Incentives](https://etherscan.io/address/0x4F30818f5c1a20803AB2075B813DBDE810e51b98)
       **/
      name: 'SendContributorIncentivesSafe',
      address: '0x4F30818f5c1a20803AB2075B813DBDE810e51b98',
      abi: [],
    },
    {
      /**
       * [Send: Multisig Signer Payouts](https://etherscan.io/address/0x5355c409fa3D0901292231Ddb953C949C2211D96)
       **/
      name: 'SendMultisigSignerPayoutsSafe',
      address: '0x5355c409fa3D0901292231Ddb953C949C2211D96',
      abi: [],
    },
    {
      /**
       * [UniswapV3Pool: send](https://etherscan.io/address/0x14F59C715C205002c6e3F36766D302c1a19bacC8)
       **/
      name: 'SendUniswapV3Pool',
      address: '0x14F59C715C205002c6e3F36766D302c1a19bacC8',
      abi: [],
    },
    {
      name: 'USDC',
      address: {
        [mainnet.id]: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // mainnet
        [localhost.id]: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // mainnet localhost fork
        [stagingMainnet.id]: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // mainnet staging fork
        [baseLocal.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', //  base mainnet fork
        [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // base mainnet
        [baseSepolia.id]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // base sepolia
      },
      abi: erc20Abi,
    },
    {
      name: 'EntryPoint',
      address: {
        [mainnet.id]: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
        [localhost.id]: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
        [stagingMainnet.id]: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
        [baseLocal.id]: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
        [base.id]: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
        [baseSepolia.id]: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      },
      abi: iEntryPointAbi,
    },
  ],
  plugins: [
    foundry({
      project: '../contracts',
      deployments: {
        SendToken: {
          1: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
          8008: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
          1337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
          [base.id]: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A', // base mainnet
          [baseSepolia.id]: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A', // base sepolia
          845337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A', // base localnet
        },
        SendMerkleDrop: {
          1: '0xB9310daE45E71c7a160A13D64204623071a8E347',
          8008: '0xB9310daE45E71c7a160A13D64204623071a8E347',
          1337: '0xB9310daE45E71c7a160A13D64204623071a8E347',
        },
        ...deployments,
      },
      include: [
        'Send*.sol/*',
        'Daimo*.sol/*',
        'ERC*.sol/*',
        'IEntryPoint*.sol/*',
        'EntryPointSimulations.sol/*',
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
        'DaimoPaymaster.sol/**', // avoid duplicate IMetaPaymaster
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
