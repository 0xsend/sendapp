import type { UserOperation } from 'permissionless'
import type { Hex } from 'viem'

/**
 * default user op with preset gas values that work will probably need to move this to the database.
 * Paymaster post-op gas limit could be set dynamically based on the status of the paymaster if the price cache is
 * outdated, otherwise, a lower post op gas limit around only 50K is needed. In case of needing to update cached price,
 * the post op uses around 75K gas.
 *
 * - [example no update price](https://www.tdly.co/shared/simulation/a0122fae-a88c-47cd-901c-02de87901b45)
 * - [Failed due to OOG](https://www.tdly.co/shared/simulation/c259922c-8248-4b43-b340-6ebbfc69bcea)
 */
export const defaultUserOp: Pick<
  UserOperation<'v0.7'>,
  | 'callGasLimit'
  | 'verificationGasLimit'
  | 'preVerificationGas'
  | 'maxFeePerGas'
  | 'maxPriorityFeePerGas'
  | 'paymasterVerificationGasLimit'
  | 'paymasterPostOpGasLimit'
  | 'paymasterData'
> = {
  callGasLimit: 150000n,
  verificationGasLimit: 550000n,
  preVerificationGas: 70000n,
  maxFeePerGas: 10000000n,
  maxPriorityFeePerGas: 10000000n,
  paymasterVerificationGasLimit: 150000n,
  paymasterPostOpGasLimit: 100000n,
  paymasterData: '0x',
} as const

export const USEROP_VERSION = 1
export const USEROP_KEY_SLOT = 0
export const USEROP_SALT = 0n

export const ERR_MSG_NOT_ENOUGH_USDC = 'Not enough USDC to cover transaction fees'

/**
 * Generates a SendAccount challenge from a user operation hash.
 */
export function generateChallenge({
  userOpHash,
  version = USEROP_VERSION,
  validUntil,
}: {
  userOpHash: Hex
  version?: number
  validUntil: number
}): {
  challenge: Hex
  versionBytes: Uint8Array
  validUntilBytes: Uint8Array
} {
  const opHash = hexToBytes(userOpHash)
  const versionBytes = numberToBytes(version, { size: 1 })
  const validUntilBytes = numberToBytes(validUntil, { size: 6 })
  // 1 byte version + 6 bytes validUntil + 32 bytes opHash
  const challenge = bytesToHex(concat([versionBytes, validUntilBytes, opHash]))
  assert(isHex(challenge) && challenge.length === 80, 'Invalid challenge')
  return {
    challenge,
    versionBytes,
    validUntilBytes,
  }
}

// Import these after function declarations to avoid circular dependencies
import { bytesToHex, concat, hexToBytes, isHex, numberToBytes } from 'viem'
import { assert } from './assert'
