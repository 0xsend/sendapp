import { decodeFunctionData, isAddress, type Address, type Hex } from 'viem'
import { sendAccountAbi, sendEarnAbi } from '@my/wagmi'
import type { UserOperation } from 'permissionless'
import { assert } from './assert'

/**
 * Decodes the callData of a UserOperation intended for a Send Earn deposit.
 * Assumes the callData executes a batch via SendAccount's executeBatch,
 * containing an approve call and a deposit call to the Send Earn vault.
 */
export function decodeDepositUserOp({ userOp }: { userOp: UserOperation<'v0.7'> }): {
  owner: Address
  vault: Address
  assets: bigint
} {
  // Decode the outer executeBatch call
  const { args: batchArgs } = decodeFunctionData({
    abi: sendAccountAbi,
    data: userOp.callData,
  })

  assert(Array.isArray(batchArgs) && batchArgs.length === 1, 'Invalid executeBatch arguments')
  const calls = batchArgs[0]
  assert(Array.isArray(calls) && calls.length >= 2, 'Expected at least two calls in batch')

  // Find the deposit call (assuming it's the second call, after approve)
  // A more robust approach might inspect call.data signature or dest address
  // Function | deposit(uint256,address)                                      | 0x6e553f65
  const depositCall = calls.find((call: { dest: Address; value: bigint; data: Hex }) =>
    call.data.startsWith('0x6e553f65')
  )

  assert(depositCall, 'Deposit call not found in batch')

  const vault = isAddress(depositCall.dest) ? depositCall.dest : null
  assert(vault, 'Invalid vault address in deposit call')

  // Decode the inner deposit call
  const { args: depositArgs, functionName } = decodeFunctionData({
    abi: sendEarnAbi, // Use the Send Earn vault ABI
    data: depositCall.data,
  })

  assert(functionName === 'deposit', 'Decoded function is not deposit') // Verify function name
  assert(Array.isArray(depositArgs), 'Invalid deposit arguments')

  // Extract amount - adjust index based on signature
  const rawAssets = depositArgs[0] // Assuming amount is the first argument
  const assets = typeof rawAssets === 'bigint' ? rawAssets : null
  assert(assets !== null, 'Invalid amount in deposit call')

  const owner = isAddress(userOp.sender) ? userOp.sender : null
  assert(!!owner, 'Invalid owner (sender) address in UserOperation')

  return {
    owner,
    assets,
    vault,
  }
}
