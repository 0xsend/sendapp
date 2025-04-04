import { type Hex, decodeFunctionData, erc20Abi, isAddress } from 'viem'

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
  const { args, functionName: rawFunctionName } = decodeFunctionData({ abi: erc20Abi, data })

  const functionName = rawFunctionName === 'transfer' ? rawFunctionName : null

  const rawTo = args?.[0]
  const to = rawTo && isAddress(rawTo) ? rawTo : null

  const rawAmount = args?.[1]
  const amount = typeof rawAmount === 'bigint' ? rawAmount : null

  return {
    functionName,
    to,
    amount,
  }
}
