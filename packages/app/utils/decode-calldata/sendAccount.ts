import { type Hex, decodeFunctionData } from 'viem'
import { sendAccountAbi } from '@my/wagmi'

export function decodeExecuteBatchCalldata(data: Hex) {
  const { args: rawArgs, functionName: rawFunctionName } = decodeFunctionData({
    abi: sendAccountAbi,
    data,
  })
  const functionName = rawFunctionName === 'executeBatch' ? rawFunctionName : null

  const args = !rawArgs || rawArgs.length === 0 ? null : rawArgs

  return { args, functionName }
}
