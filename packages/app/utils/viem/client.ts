import { createPublicClient, http } from 'viem'
import { mainnet as mainnetViem, localhost, type Chain } from 'wagmi/chains'
import debug from 'debug'

const log = debug('app:utils:viem:client')

// allow for creating private RPC url
const MAINNET_RPC_URL =
  process.env.MAINNET_RPC_URL ?? process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? 'http://127.0.0.1:8545/'

const staging: Chain = {
  id: 8008,
  name: 'Sendstack Anvil Staging',
  rpcUrls: {
    default: {
      http: ['https://sendstack-anvil.metalrodeo.xyz'],
    },
    public: {
      http: ['https://sendstack-anvil.metalrodeo.xyz'],
    },
  },
  nativeCurrency: mainnetViem.nativeCurrency,
  network: 'sendnet',
}

const appChains = {
  [String(mainnetViem.id)]: mainnetViem,
  [String(staging.id)]: staging,
  [String(localhost.id)]: localhost,
}

const envToChain = () => {
  if (process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID) {
    const chain = appChains[process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID!]
    if (!chain) {
      throw new Error(`Unknown chain id: ${process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID}`)
    }
    return chain
  }
  if (__DEV__ || process.env.CI) {
    return localhost
  }
  return mainnetViem
}

const chain = envToChain()

log(
  'Using chain',
  `chain=${chain.name}`,
  `hostname=${new URL(chain.rpcUrls.default.http[0]).hostname}`
)

export const mainnet = chain

export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(MAINNET_RPC_URL),
})
