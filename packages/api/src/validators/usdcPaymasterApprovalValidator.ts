import type { Validator, ValidationResult } from './types'
import { encodeFunctionData, decodeFunctionData, erc20Abi } from 'viem'
import { sendAccountAbi, tokenPaymasterAddress, usdcAddress } from '@my/wagmi'
import debug from 'debug'

const log = debug('api:validators:usdcPaymasterApproval')

interface UsdcPaymasterApprovalContext {
  spender: string
  amount: bigint
}

export const usdcPaymasterApprovalValidator: Validator<UsdcPaymasterApprovalContext> = {
  id: 'usdcPaymasterApproval',
  validate({ userop, sendAccountCalls, chainId }): ValidationResult<UsdcPaymasterApprovalContext> {
    if (!sendAccountCalls || sendAccountCalls.length !== 1) {
      return {
        ok: false,
        reason: 'USDC paymaster approval requires exactly 1 call',
      }
    }

    const [call] = sendAccountCalls

    if (!call) {
      return {
        ok: false,
        reason: 'Approval call must be present',
      }
    }

    // Validate dest is USDC contract
    if (call.dest !== usdcAddress[chainId]) {
      return {
        ok: false,
        reason: `Approval dest must be USDC address for chain ${chainId}`,
      }
    }

    // Decode and validate approve call
    try {
      const decoded = decodeFunctionData({
        abi: erc20Abi,
        data: call.data,
      })

      if (decoded.functionName !== 'approve') {
        return {
          ok: false,
          reason: 'Function must be approve',
        }
      }

      const [spender, amount] = decoded.args as [string, bigint]

      // Validate spender is token paymaster
      if (spender !== tokenPaymasterAddress[chainId]) {
        return {
          ok: false,
          reason: `Spender must be token paymaster address for chain ${chainId}`,
        }
      }

      // Verify executeBatch calldata matches
      const expectedCallData = encodeFunctionData({
        abi: sendAccountAbi,
        functionName: 'executeBatch',
        args: [sendAccountCalls],
      })

      if (userop.callData !== expectedCallData) {
        log('callData mismatch for USDC paymaster approval')
        return {
          ok: false,
          reason: 'UserOp callData does not match expected executeBatch call',
        }
      }

      log('Validated as USDC paymaster approval', { spender, amount: String(amount) })
      return {
        ok: true,
        context: { spender, amount },
      }
    } catch (e) {
      log('Failed to decode approval call', e)
      return {
        ok: false,
        reason: 'Invalid approval call data',
      }
    }
  },
}
