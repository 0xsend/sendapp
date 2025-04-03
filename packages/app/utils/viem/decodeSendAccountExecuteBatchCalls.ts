import { sendAccountAbi } from '@my/wagmi'
import { decodeFunctionData } from 'viem'
import { assert } from '../assert'

export type SendAccountCall = {
  dest: `0x${string}`
  value: bigint
  data: `0x${string}`
}

/**
 * Decodes the calldata of a UserOperation intended for a SendAccount executeBatch.
 */
export function decodeSendAccountExecuteBatchCalls(
  calldata: `0x${string}`
): readonly SendAccountCall[] {
  const result = decodeFunctionData({
    abi: sendAccountAbi,
    data: calldata,
  })

  assert(result.functionName === 'executeBatch', 'Invalid function name')

  return result.args[0]
}
