import { decodeFunctionData, isAddress, type Hex } from 'viem'
import { baseJackpotAbi } from '@my/wagmi'

export function decodePurchaseTicketsCallData(data: Hex) {
  const { args, functionName } = decodeFunctionData({
    abi: baseJackpotAbi,
    data,
  })

  const rawReferrer = args?.[0] as unknown as string
  const referrer = isAddress(rawReferrer) ? rawReferrer : null

  const rawValue = args?.[1]
  const value = typeof rawValue === 'bigint' ? rawValue : null

  const rawRecipient = args?.[2] as unknown as string
  const recipient = isAddress(rawRecipient) ? rawRecipient : null

  const rawBuyer = args?.[2] as unknown as string
  const buyer = isAddress(rawBuyer) ? rawBuyer : null

  return {
    functionName,
    referrer,
    value,
    recipient,
    buyer,
  }
}
