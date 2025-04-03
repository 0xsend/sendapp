import { sendEarnAbi, sendEarnUsdcFactoryAbi } from '@my/wagmi'
import type { UserOperation } from 'permissionless'
import { decodeFunctionData, type Address } from 'viem'
import { assert } from './assert'
import { decodeSendAccountExecuteBatchCalls } from './viem'
/**
 * A direct deposit into vault usually in the case of
 * a user having existing deposit or no referrer.
 *
 * `deposit(uint256,address) | 0x6e553f65`
 */
const VAULT_DEPOSIT_SIG = '0x6e553f65'
/**
 * Deposit using the Send Earn Factory when the user has no existing deposit and
 * is using a referrer that is a new affiliate (new vault).
 * createAndDeposit with a referrer.
 * `createAndDeposit(address,bytes32,uint256) | 0xb473b00b |`
 */
const FACTORY_DEPOSIT_SIG = '0xb473b00b'

/**
 * Decodes the calldata for a user operation depositing into Send Earn.
 *
 * @throws {Error} If the user operation does not contain a valid Send Earn deposit.
 *
 * @see VAULT_DEPOSIT_SIG
 * @see FACTORY_DEPOSIT_SIG
 */
export function decodeSendEarnDepositUserOp({ userOp }: { userOp: UserOperation<'v0.7'> }):
  | {
      owner: Address
      vault: Address
      assets: bigint
    }
  | {
      owner: Address
      referrer: Address
      assets: bigint
    } {
  // Decode the outer executeBatch call
  const calls = decodeSendAccountExecuteBatchCalls(userOp.callData)

  assert(calls.length > 0, 'Invalid number of calls in UserOperation')
  assert(
    calls.filter(
      (c) => c.data.startsWith(VAULT_DEPOSIT_SIG) || c.data.startsWith(FACTORY_DEPOSIT_SIG)
    ).length === 1,
    'Expected exactly one deposit call in batch'
  )

  // look for deposit signature
  const vaultDeposit = calls.find((c) => c.data.startsWith(VAULT_DEPOSIT_SIG))
  if (vaultDeposit) {
    const decoded = decodeFunctionData({
      abi: sendEarnAbi,
      data: vaultDeposit.data,
    })
    assert(decoded.functionName === 'deposit', 'Invalid deposit function name')
    const [assets, owner] = decoded.args
    return {
      owner,
      assets,
      vault: vaultDeposit.dest,
    }
  }
  const factoryDeposit = calls.find((c) => c.data.startsWith(FACTORY_DEPOSIT_SIG))
  if (factoryDeposit) {
    const decoded = decodeFunctionData({
      abi: sendEarnUsdcFactoryAbi,
      data: factoryDeposit.data,
    })
    assert(decoded.functionName === 'createAndDeposit', 'Invalid createAndDeposit function name')
    const [referrer, , assets] = decoded.args
    return {
      owner: userOp.sender,
      assets,
      referrer,
    }
  }
  throw new Error('Failed to decode a valid Send Earn Deposit from user op')
}
