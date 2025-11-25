import type { Validator, ValidationResult } from './types'
import { encodeFunctionData } from 'viem'
import { sendAccountAbi, sendTokenV0Address, sendTokenV0LockboxAddress } from '@my/wagmi'
import debug from 'debug'

const log = debug('api:validators:sendTokenUpgrade')

interface SendTokenUpgradeContext {
  approval: {
    dest: string
    value: bigint
    data: string
  }
  deposit: {
    dest: string
    value: bigint
    data: string
  }
}

export const sendTokenUpgradeValidator: Validator<SendTokenUpgradeContext> = {
  id: 'sendTokenUpgrade',
  validate({ userop, sendAccountCalls, chainId }): ValidationResult<SendTokenUpgradeContext> {
    if (!sendAccountCalls || sendAccountCalls.length !== 2) {
      return {
        ok: false,
        reason: 'Send token upgrade requires exactly 2 calls (approval + deposit)',
      }
    }

    const [approval, deposit] = sendAccountCalls

    if (!approval || !deposit) {
      return {
        ok: false,
        reason: 'Both approval and deposit calls must be present',
      }
    }

    // Validate approval call
    if (approval.dest !== sendTokenV0Address[chainId]) {
      return {
        ok: false,
        reason: 'Approval dest must be Send V0 token address',
      }
    }

    if (!approval.data.startsWith('0x095ea7b3')) {
      // approve(address,uint256)
      return {
        ok: false,
        reason: 'Approval must call approve function',
      }
    }

    // Validate deposit call
    if (deposit.dest !== sendTokenV0LockboxAddress[chainId]) {
      return {
        ok: false,
        reason: 'Deposit dest must be Send V0 lockbox address',
      }
    }

    if (!deposit.data.startsWith('0xb6b55f25')) {
      // deposit(uint256)
      return {
        ok: false,
        reason: 'Deposit must call deposit function',
      }
    }

    // Verify executeBatch calldata matches
    const expectedCallData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [sendAccountCalls],
    })

    if (userop.callData !== expectedCallData) {
      log('callData mismatch for send token upgrade')
      return {
        ok: false,
        reason: 'UserOp callData does not match expected executeBatch call',
      }
    }

    log('Validated as send token upgrade')
    return {
      ok: true,
      context: { approval, deposit },
    }
  },
}
