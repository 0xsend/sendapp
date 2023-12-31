import { defineConfig } from '@wagmi/cli'
import { actions, foundry } from '@wagmi/cli/plugins'
import { globby } from 'globby'

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
    // TODO add @my/contracts
  ],
  plugins: [
    foundry({
      project: '../contracts',
      deployments: {
        Send: {
          1: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
          8008: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
          1337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
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
        'Entrypoint*.sol/*',
        'IEntryPoint*.sol/*',
      ],
    }),
    actions({
      getContract: true,
      readContract: true,
      writeContract: true,
      watchContractEvent: false,
      // overridePackageName: '@wagmi/core',
    }),
  ],
})
