import { defineConfig } from '@wagmi/cli'
import { actions, foundry } from '@wagmi/cli/plugins'
import { mainnet } from 'wagmi/chains'
import { getSafeSingletonDeployment } from '@safe-global/safe-deployments'

// Returns released contract version for specific version
const safeSingleton130Mainnet = getSafeSingletonDeployment({
  version: '1.3.0',
  network: mainnet.id.toString(),
})

if (!safeSingleton130Mainnet) {
  throw new Error('No safe singleton deployment found')
}

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
    {
      name: 'SendRevenueSafe',
      address: '0xBB253919a15C5E0C9986d83f205A9279b4247E3d',
      abi: safeSingleton130Mainnet?.abi,
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
      },
      exclude: [
        // the following patterns are excluded by default
        'Common.sol/**',
        'Helper.sol/**',
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
        'Test.sol/**',
        'Test*.sol/**',
        'MockERC20.sol/**',
        'MockERC721.sol/**',
        '**.s.sol/*.json',
        '**.t.sol/*.json',
        '*Proxy.sol/**',
      ],
      include: [
        'Send*.sol/**',
        'Daimo*.sol/**',
        'ERC*.sol/**',
        'Entrypoint*.sol/**',
        'IEntryPoint*.sol/**',
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
