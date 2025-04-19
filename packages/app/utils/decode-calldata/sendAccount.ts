import { type Address, type Hex, decodeFunctionData } from 'viem'
import { sendAccountAbi } from '@my/wagmi'
import { assert } from '../assert'

export type SendAccountCall = {
  dest: Address
  value: bigint
  data: Hex
}

/**
 * Decodes the calldata of a UserOperation intended for a SendAccount executeBatch.
 */
export function decodeExecuteBatchCalldata(data: Hex): readonly SendAccountCall[] {
  const result = decodeFunctionData({
    abi: sendAccountAbi,
    data,
  })
  assert(result.functionName === 'executeBatch', 'Invalid function name')
  assert(result.args.length > 0, 'Invalid number of calls in UserOperation')

  return result.args[0]
}
