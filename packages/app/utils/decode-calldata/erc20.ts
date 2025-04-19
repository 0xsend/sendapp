import { type Hex, decodeFunctionData, erc20Abi, isAddress } from 'viem'
import { assert } from '../assert'

export function decodeApproveTokenCallData(data: Hex) {
  const { args: approveTokenArgs, functionName: rawFunctionName } = decodeFunctionData({
    abi: erc20Abi,
    data,
  })

  const functionName = rawFunctionName === 'approve' ? rawFunctionName : null

  const rawSpender = approveTokenArgs?.[0]
  const spender = rawSpender && isAddress(rawSpender) ? rawSpender : null

  const rawValue = approveTokenArgs?.[1]
  const value = typeof rawValue === 'bigint' ? rawValue : null

  return {
    functionName,
    spender,
    value,
  }
}

export function decodeTransferCallData(data: Hex) {
  const decoded = decodeFunctionData({ abi: erc20Abi, data })
  assert(decoded.functionName === 'transfer', 'Invalid function name')

  const [to, amount] = decoded.args
  assert(isAddress(to), 'Invalid to address')
  assert(typeof amount === 'bigint', 'Invalid amount')

  return {
    to,
    amount,
  }
}
