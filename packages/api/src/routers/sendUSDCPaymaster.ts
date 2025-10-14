import { baseMainnet, tokenPaymasterAbi, tokenPaymasterAddress, usdcAddress } from '@my/wagmi'
import { TRPCError } from '@trpc/server'
import { address } from 'app/utils/zod'
import { UserOperationSchema } from 'app/utils/zod/evm'
import debug from 'debug'
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import { concat, createPublicClient, encodePacked, http } from 'viem'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

const PRICE_DENOM = BigInt(1e26)

// TokenPaymaster gas limit estimates
// These are conservative estimates based on TokenPaymaster.sol gas usage:
// - Verification: reads config, cached price, performs ERC20 transferFrom (~70-100k gas)
// - PostOp: refunds tokens, updates price oracle, emits events (~40-50k gas)
const TOKEN_PAYMASTER_VERIFICATION_GAS_LIMIT = 100000n
const TOKEN_PAYMASTER_POSTOP_GAS_LIMIT = 50000n

// Public client for reading TokenPaymaster contract
const publicClient = createPublicClient({
  chain: baseMainnet,
  transport: http(),
})

/**
 * Calculates the required prefund for a user operation based on the Entrypoint 0.7 contract.
 * @see https://github.com/eth-infinitism/account-abstraction/blob/f2b09e60a92d5b3177c68d9f382912ccac19e8db/contracts/core/EntryPoint.sol#L402
 */
function calculatePrefund(userOp: {
  verificationGasLimit: bigint
  callGasLimit: bigint
  paymasterVerificationGasLimit?: bigint
  paymasterPostOpGasLimit?: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
}): bigint {
  const requiredGas =
    userOp.verificationGasLimit +
    userOp.callGasLimit +
    (userOp.paymasterVerificationGasLimit ?? 0n) +
    (userOp.paymasterPostOpGasLimit ?? 0n) +
    userOp.preVerificationGas
  return requiredGas * userOp.maxFeePerGas
}

/**
 * Calculates the required USDC token amount for a user operation
 * based on TokenPaymaster pricing with markup.
 */
async function calculateRequiredTokenAmount({
  userOp,
  refundPostopCost,
  cachedPriceWithMarkup,
  baseFee,
}: {
  userOp: {
    verificationGasLimit: bigint
    callGasLimit: bigint
    paymasterVerificationGasLimit?: bigint
    paymasterPostOpGasLimit?: bigint
    preVerificationGas: bigint
    maxFeePerGas: bigint
  }
  refundPostopCost: bigint
  cachedPriceWithMarkup: bigint
  baseFee: bigint
}): Promise<bigint> {
  const requiredPreFund = calculatePrefund(userOp)
  const addedPostOpCost = refundPostopCost * userOp.maxFeePerGas
  const preChargeNative = requiredPreFund + addedPostOpCost

  const tokenAmount = await publicClient.readContract({
    address: tokenPaymasterAddress[baseMainnet.id],
    abi: tokenPaymasterAbi,
    functionName: 'weiToToken',
    args: [preChargeNative, cachedPriceWithMarkup],
  })

  return tokenAmount + baseFee
}

/**
 * ERC-7677 Paymaster Router for USDC TokenPaymaster
 *
 * Implements the Base ERC-7677 specification for ERC-20 token paymasters.
 * Provides methods for getting paymaster stub data and final paymaster data
 * with USDC token payment details.
 *
 * @see https://docs.base.org/base-account/improve-ux/sponsor-gas/erc20-paymasters
 */
export const sendUSDCPaymasterRouter = createTRPCRouter({
  /**
   * pm_getPaymasterStubData - ERC-7677 compliant method
   *
   * Returns stub paymaster data for gas estimation with USDC token payment.
   * Conforms to Base ERC-7677 specification for ERC-20 paymasters.
   *
   * @see https://docs.base.org/base-account/improve-ux/sponsor-gas/erc20-paymasters
   */
  getPaymasterStubData: protectedProcedure
    .input(
      z.object({
        userOp: UserOperationSchema.omit({
          paymasterAndData: true,
          signature: true,
        }).extend({
          signature: z.string().optional(),
        }),
        entryPoint: address,
        context: z
          .object({
            erc20: address.optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx: { session }, input: { userOp, entryPoint, context } }) => {
      const log = debug(`api:routers:sendUSDCPaymaster:getPaymasterStubData:${session.user.id}`)

      if (entryPoint !== ENTRYPOINT_ADDRESS_V07) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid entry point',
        })
      }

      // If context specifies a token, it must be USDC
      const requestedToken = context?.erc20
      if (requestedToken && requestedToken !== usdcAddress[baseMainnet.id]) {
        log('Rejected: unsupported token requested', { requestedToken })
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Unsupported token',
          cause: {
            data: {
              acceptedTokens: [
                {
                  address: usdcAddress[baseMainnet.id],
                  name: 'USDC',
                },
              ],
              paymasterAddress: tokenPaymasterAddress[baseMainnet.id],
            },
          },
        })
      }

      log('Generating stub paymaster data for USDC token paymaster')

      // Generate stub paymasterAndData:
      // Format: <paymasterAddress (20 bytes)><verificationGasLimit (16 bytes)><postOpGasLimit (16 bytes)><paymasterData (variable)>
      // For TokenPaymaster, paymasterData can optionally include price (32 bytes)
      const paymasterAddress = tokenPaymasterAddress[baseMainnet.id]

      // Stub paymasterAndData without price data (will use cached price)
      const paymasterAndData = concat([
        paymasterAddress,
        encodePacked(
          ['uint128', 'uint128'],
          [TOKEN_PAYMASTER_VERIFICATION_GAS_LIMIT, TOKEN_PAYMASTER_POSTOP_GAS_LIMIT]
        ),
      ])

      return {
        paymasterAndData,
        paymasterVerificationGasLimit: TOKEN_PAYMASTER_VERIFICATION_GAS_LIMIT,
        paymasterPostOpGasLimit: TOKEN_PAYMASTER_POSTOP_GAS_LIMIT,
      }
    }),
  /**
   * pm_getPaymasterData - ERC-7677 compliant method
   *
   * Returns final paymaster data with USDC token payment details.
   * Conforms to Base ERC-7677 specification for ERC-20 paymasters.
   *
   * @see https://docs.base.org/base-account/improve-ux/sponsor-gas/erc20-paymasters
   */
  getPaymasterData: protectedProcedure
    .input(
      z.object({
        userOp: UserOperationSchema.omit({
          paymasterAndData: true,
          signature: true,
        }).extend({
          signature: z.string().optional(),
        }),
        entryPoint: address,
        context: z
          .object({
            erc20: address.optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx: { session }, input: { userOp, entryPoint, context } }) => {
      const log = debug(`api:routers:sendUSDCPaymaster:getPaymasterData:${session.user.id}`)

      if (entryPoint !== ENTRYPOINT_ADDRESS_V07) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid entry point',
        })
      }

      // If context specifies a token, it must be USDC
      const requestedToken = context?.erc20
      if (requestedToken && requestedToken !== usdcAddress[baseMainnet.id]) {
        log('Rejected: unsupported token requested', { requestedToken })
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Unsupported token',
          cause: {
            data: {
              acceptedTokens: [
                {
                  address: usdcAddress[baseMainnet.id],
                  name: 'USDC',
                },
              ],
              paymasterAddress: tokenPaymasterAddress[baseMainnet.id],
            },
          },
        })
      }

      log('Generating paymaster data with token payment details')

      // Read TokenPaymaster config
      const [paymasterConfig, cachedPrice] = await Promise.all([
        publicClient.readContract({
          address: tokenPaymasterAddress[baseMainnet.id],
          abi: tokenPaymasterAbi,
          functionName: 'tokenPaymasterConfig',
        }),
        publicClient.readContract({
          address: tokenPaymasterAddress[baseMainnet.id],
          abi: tokenPaymasterAbi,
          functionName: 'cachedPrice',
        }),
      ])

      const [priceMarkup, , refundPostopCost, , baseFee] = paymasterConfig
      const cachedPriceWithMarkup = (cachedPrice * PRICE_DENOM) / priceMarkup

      // Calculate required token amount
      const maxFee = await calculateRequiredTokenAmount({
        userOp: {
          verificationGasLimit: userOp.verificationGasLimit,
          callGasLimit: userOp.callGasLimit,
          paymasterVerificationGasLimit: TOKEN_PAYMASTER_VERIFICATION_GAS_LIMIT,
          paymasterPostOpGasLimit: TOKEN_PAYMASTER_POSTOP_GAS_LIMIT,
          preVerificationGas: userOp.preVerificationGas,
          maxFeePerGas: userOp.maxFeePerGas,
        },
        refundPostopCost: BigInt(refundPostopCost),
        cachedPriceWithMarkup,
        baseFee: BigInt(baseFee),
      })

      const paymasterAddress = tokenPaymasterAddress[baseMainnet.id]

      // Generate paymasterAndData without price data (using cached price)
      const paymasterAndData = concat([
        paymasterAddress,
        encodePacked(
          ['uint128', 'uint128'],
          [TOKEN_PAYMASTER_VERIFICATION_GAS_LIMIT, TOKEN_PAYMASTER_POSTOP_GAS_LIMIT]
        ),
      ])

      log('Generated paymaster data', {
        maxFee: maxFee.toString(),
        tokenAddress: usdcAddress[baseMainnet.id],
      })

      return {
        paymasterAndData,
        paymasterVerificationGasLimit: TOKEN_PAYMASTER_VERIFICATION_GAS_LIMIT,
        paymasterPostOpGasLimit: TOKEN_PAYMASTER_POSTOP_GAS_LIMIT,
        tokenPayment: {
          tokenAddress: usdcAddress[baseMainnet.id],
          maxFee: maxFee.toString(),
          decimals: 6,
          name: 'USDC',
        },
      }
    }),
})
