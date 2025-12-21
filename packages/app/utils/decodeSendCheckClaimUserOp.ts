import { sendCheckAbi, sendCheckAddress } from '@my/wagmi'
import type { UserOperation } from 'permissionless'
import { decodeFunctionData, type Address, type Hex } from 'viem'
import { assert } from './assert'
import { decodeSendAccountExecuteBatchCalls } from './viem'

/**
 * claimCheck(address,bytes) selector
 * keccak256("claimCheck(address,bytes)") = 0xdebffe29
 */
const CLAIM_CHECK_SIG = '0xdebffe29'

export type SendCheckClaimCall = {
  ephemeralAddress: Address
  signature: Hex
  checkContract: Address
}

/**
 * Decodes the calldata for a user operation claiming a SendCheck.
 *
 * @throws {Error} If the user operation does not contain a valid SendCheck claim.
 */
export function decodeSendCheckClaimUserOp({
  userOp,
  chainId,
}: { userOp: UserOperation<'v0.7'>; chainId: number }): SendCheckClaimCall {
  const calls = decodeSendAccountExecuteBatchCalls(userOp.callData)

  assert(calls.length === 1, 'SendCheck claim must have exactly 1 call')

  const claimCall = calls[0]
  assert(claimCall !== undefined, 'Claim call must be present')
  assert(claimCall.data.startsWith(CLAIM_CHECK_SIG), 'Call must be claimCheck function')

  const expectedCheckAddress = sendCheckAddress[chainId as keyof typeof sendCheckAddress]
  assert(expectedCheckAddress !== undefined, `SendCheck not deployed on chain ${chainId}`)
  assert(
    claimCall.dest.toLowerCase() === expectedCheckAddress.toLowerCase(),
    'Call must target SendCheck contract'
  )

  const decoded = decodeFunctionData({
    abi: sendCheckAbi,
    data: claimCall.data,
  })

  assert(decoded.functionName === 'claimCheck', 'Invalid function name')

  const [ephemeralAddress, signature] = decoded.args

  return {
    ephemeralAddress,
    signature,
    checkContract: claimCall.dest,
  }
}
