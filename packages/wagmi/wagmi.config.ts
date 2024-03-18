import { defineConfig } from '@wagmi/cli'
import { react, actions, foundry } from '@wagmi/cli/plugins'
import { pascalCase } from 'change-case'
import { globby } from 'globby'
import { erc20Abi } from 'viem'
import { base, baseSepolia, mainnet, sepolia } from 'viem/chains'
import { localhost, baseLocal } from './src/chains'
import { iEntryPointAbi } from './src'

const broadcasts = await globby([`${process.cwd()}/../contracts/broadcast/**/run-latest.json`])

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

console.log({ deployments })

// @ts-expect-error it's parsed JSON
const deployedSendMerkleDrop = deployments.SendMerkleDrop

if (!deployedSendMerkleDrop) throw new Error('No SendMerkleDrop found.')

// @ts-expect-error it's parsed JSON
const accountFactory = deployments.DaimoAccountFactory
if (!accountFactory) throw new Error('No DaimoAccountFactory found.')
if (accountFactory[base.id])
  throw new Error(
    'DaimoAccountFactory already deployed on base mainnet. Failing to avoid duplicate.'
  )

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
  ],
  plugins: [
    foundry({
      project: '../contracts',
      deployments: {
        SendToken: {
          1: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
          [sepolia.id]: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
          1337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
          [base.id]: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A', // base mainnet
          [baseSepolia.id]: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A', // base sepolia
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
        DaimoAccountFactory: {
          ...accountFactory,
          [base.id]: '0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745', // not deployed yet
        },
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
