import { fetchRequiredUSDCBalance } from './useUSDCFees'
import {
  type Chain,
  createPublicClient,
  formatUnits,
  http,
  type PublicClient,
  type Transport,
} from 'viem'
import { base, baseSepolia } from 'viem/chains'
import debugBase from 'debug'
import { baseLocal } from '@my/wagmi/chains'
import { tokenPaymasterAbi, tokenPaymasterAddress } from '@my/wagmi'
import type { UserOperation } from 'permissionless'
const debug = debugBase('app:utils:useUSDCFees.example')

// const userOp = {
//   callData:
//     '0x34fcd5be0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000003f14920c99beb920afa163031c4e47a3e03b3e4a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000c800f68e363f14986a6ad0ce40dd5324097a219c000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000',
//   callGasLimit: 100000n,
//   maxFeePerGas: 12423245n,
//   maxPriorityFeePerGas: 1000000n,
//   nonce: 12n,
//   paymaster: '0x592e1224D203Be4214B15e205F6081FbbaCFcD2D',
//   paymasterData: '0x',
//   paymasterPostOpGasLimit: 100000n,
//   paymasterVerificationGasLimit: 150000n,
//   preVerificationGas: 70000n,
//   sender: '0x5C23863030C0f2b915A6A8583B4E65a5331860c4',
//   signature: '0x',
//   verificationGasLimit: 550000n,
// } as const
const userOp = {
  callData:
    '0x34fcd5be0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000120000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000c2781d5fcde2d80886d8eb0b80930fee89a2061d00000000000000000000000000000000000000000000000000000000006acfc000000000000000000000000000000000000000000000000000000000000000000000000000000000c2781d5fcde2d80886d8eb0b80930fee89a2061d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000647a53a6db00000000000000000000000000000000000000000000000000000000006acfc00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  callGasLimit: 125112n,
  maxFeePerGas: 1000000008n,
  maxPriorityFeePerGas: 1000000000n,
  nonce: 1n,
  paymaster: '0x592e1224D203Be4214B15e205F6081FbbaCFcD2D',
  paymasterData: '0x',
  paymasterPostOpGasLimit: 100000n,
  paymasterVerificationGasLimit: 150000n,
  preVerificationGas: 70000n,
  sender: '0x102C576E673c1411016038a14A4c1DCCf83feFC5',
  signature: '0x',
  verificationGasLimit: 550000n,
} as const

debug(userOp)

const baseClient = createPublicClient({
  chain: base,
  transport: http(base.rpcUrls.default.http[0]),
})

await fetchUserOpFeeEstimate({
  client: baseClient,
  userOp,
})

const baseSepoliaClient = createPublicClient({
  chain: baseSepolia,
  transport: http(baseSepolia.rpcUrls.default.http[0]),
})

await fetchUserOpFeeEstimate({
  client: baseSepoliaClient,
  userOp,
})

const localClient = createPublicClient({
  chain: baseLocal,
  transport: http(baseLocal.rpcUrls.default.http[0]),
})

await fetchUserOpFeeEstimate({
  client: localClient,
  userOp,
})

/**
 * Fetches the fee estimate for a user operation and calculates the required usdc balance for using the USDC Token Paymaster.
 * @param userOp - The user operation to estimate the gas for.
 * @returns The gas estimate and the required usdc balance.
 */
export async function fetchUserOpFeeEstimate<TTransport extends Transport, TChain extends Chain>({
  client,
  userOp,
}: {
  client: PublicClient<TTransport, TChain>
  userOp: UserOperation<'v0.7'>
}) {
  const log = debug.extend(client.chain.name)
  log('checking', new URL(client.chain.rpcUrls.default.http[0] ?? '').hostname)

  log('feesPerGas', {
    maxFeePerGas: `${formatUnits(userOp.maxFeePerGas, 9)} gwei`,
    maxPriorityFeePerGas: `${formatUnits(userOp.maxPriorityFeePerGas, 9)} gwei`,
  })

  const gasFees = await client.estimateFeesPerGas()

  log('feesPerGas [network]', {
    maxFeePerGas: `${formatUnits(gasFees.maxFeePerGas, 9)} gwei`,
    maxPriorityFeePerGas: `${formatUnits(gasFees.maxPriorityFeePerGas, 9)} gwei`,
  })

  const [priceMarkup, minEntryPointBalance, refundPostopCost, priceMaxAge, baseFee, rewardsPool] =
    await client.readContract({
      address: tokenPaymasterAddress[client.chain.id],
      abi: tokenPaymasterAbi,
      functionName: 'tokenPaymasterConfig',
      args: [],
    })

  log('tokenPaymasterConfig', {
    priceMarkup,
    minEntryPointBalance,
    refundPostopCost,
    priceMaxAge,
    baseFee,
    rewardsPool,
  })
  const cachedPrice = await client.readContract({
    address: tokenPaymasterAddress[client.chain.id],
    abi: tokenPaymasterAbi,
    functionName: 'cachedPrice',
    args: [],
  })
  log('cachedPrice', cachedPrice)
  const cachedPriceWithMarkup = (cachedPrice * BigInt(1e26)) / priceMarkup
  const requiredUsdcBalance = await fetchRequiredUSDCBalance({
    userOp,
    refundPostopCost,
    client,
    cachedPriceWithMarkup,
  })
  log('usdc for gas', requiredUsdcBalance, formatUnits(requiredUsdcBalance, 6))
  log(
    'total + base fee',
    requiredUsdcBalance + BigInt(baseFee),
    formatUnits(requiredUsdcBalance + BigInt(baseFee), 6)
  )
}
