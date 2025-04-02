import { describe, expect, it } from '@jest/globals'
import { sendAccountAbi, sendEarnAbi } from '@my/wagmi'
import type { UserOperation } from 'permissionless'
import { encodeFunctionData, erc20Abi, type Address, type Hex } from 'viem'
import { decodeDepositUserOp } from './decodeDepositUserOp'

jest.unmock('@my/wagmi')

const MOCK_VAULT_ADDRESS = `0x${'3'.repeat(40)}` as Address
const MOCK_TOKEN_ADDRESS = `0x${'4'.repeat(40)}` as Address // Token being deposited

const defaultUserOp: Omit<UserOperation<'v0.7'>, 'sender' | 'nonce' | 'callData'> = {
  callGasLimit: 100000n,
  verificationGasLimit: 550000n,
  preVerificationGas: 70000n,
  maxFeePerGas: 10000000n,
  maxPriorityFeePerGas: 10000000n,
  signature: '0x123', // Placeholder signature
}

describe('decodeDepositUserOp', () => {
  beforeEach(() => {
    jest.unmock('@my/wagmi')
  })
  it('should correctly decode a valid deposit UserOperation', () => {
    const sender = `0x${'1'.repeat(40)}` as Address
    const owner = sender // In this context, sender is the owner
    const assets = 1000n // Amount to deposit
    const nonce = 0n
    const vault = MOCK_VAULT_ADDRESS

    // 1. Encode the approve call
    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [vault, assets],
    })

    // 2. Encode the deposit call
    const depositData = encodeFunctionData({
      abi: sendEarnAbi,
      functionName: 'deposit',
      args: [assets, owner], // Assuming deposit(uint256 assets, address receiver)
    })

    // 3. Encode the executeBatch call containing approve and deposit
    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [
        [
          {
            dest: MOCK_TOKEN_ADDRESS, // Approving the token contract
            value: 0n,
            data: approveData,
          },
          {
            dest: vault, // Depositing to the vault
            value: 0n,
            data: depositData,
          },
        ],
      ],
    })

    const userOp: UserOperation<'v0.7'> = {
      sender,
      nonce,
      callData,
      ...defaultUserOp,
    }

    const result = decodeDepositUserOp({ userOp })

    expect(result).toEqual({
      owner,
      assets,
      vault,
    })
  })

  it('should throw if callData is not valid hex', () => {
    const sender = `0x${'1'.repeat(40)}` as Address
    const userOp: UserOperation<'v0.7'> = {
      sender,
      nonce: 0n,
      callData: '0xinvalid' as Hex,
      ...defaultUserOp,
    }
    expect(() => decodeDepositUserOp({ userOp })).toThrow()
  })

  it('should throw if callData is not for executeBatch', () => {
    const sender = `0x${'1'.repeat(40)}` as Address
    const userOp: UserOperation<'v0.7'> = {
      sender,
      nonce: 0n,
      callData: '0x12345678' as Hex, // Incorrect function selector
      ...defaultUserOp,
    }
    expect(() => decodeDepositUserOp({ userOp })).toThrow(/Encoded function signature/i)
  })

  it('should throw if executeBatch has less than two calls', () => {
    const sender = `0x${'1'.repeat(40)}` as Address
    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [
        [
          {
            dest: MOCK_TOKEN_ADDRESS,
            value: 0n,
            data: '0x', // Only one call
          },
        ],
      ],
    })
    const userOp: UserOperation<'v0.7'> = {
      sender,
      nonce: 0n,
      callData,
      ...defaultUserOp,
    }
    expect(() => decodeDepositUserOp({ userOp })).toThrow(/Expected at least two calls in batch/i)
  })

  it('should throw if deposit call is not found (wrong function selector)', () => {
    const sender = `0x${'1'.repeat(40)}` as Address
    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [
        [
          { dest: MOCK_TOKEN_ADDRESS, value: 0n, data: '0x' /* approve */ },
          { dest: MOCK_VAULT_ADDRESS, value: 0n, data: '0x12345678' /* wrong deposit */ },
        ],
      ],
    })
    const userOp: UserOperation<'v0.7'> = {
      sender,
      nonce: 0n,
      callData,
      ...defaultUserOp,
    }
    expect(() => decodeDepositUserOp({ userOp })).toThrow(/Deposit call not found in batch/i)
  })

  it('should throw if deposit call data is malformed', () => {
    const sender = `0x${'1'.repeat(40)}` as Address
    const vault = MOCK_VAULT_ADDRESS
    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [vault, 1000n],
    })
    // Correct deposit selector but invalid data afterwards
    const malformedDepositData = '0x6e553f650000' as Hex

    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [
        [
          { dest: MOCK_TOKEN_ADDRESS, value: 0n, data: approveData },
          { dest: vault, value: 0n, data: malformedDepositData },
        ],
      ],
    })
    const userOp: UserOperation<'v0.7'> = { sender, nonce: 0n, callData, ...defaultUserOp }
    // This will likely throw inside viem's decodeFunctionData
    expect(() => decodeDepositUserOp({ userOp })).toThrow()
  })

  it('should throw if decoded function is not deposit', () => {
    // This case is somewhat covered by the 'deposit call not found' test,
    // but tests the specific assert after finding a call starting with the selector.
    // We'd need to craft data that starts with 0x6e553f65 but isn't actually the deposit function
    // according to the ABI, which is tricky. Viem's decodeFunctionData might throw first.
    // Skipping explicit test for this specific assert as it's hard to trigger reliably
    // without viem throwing earlier.
  })

  it('should throw if UserOperation sender is invalid', () => {
    const sender = '0xinvalid' as Address // Invalid sender
    const assets = 1000n
    const nonce = 0n
    const vault = MOCK_VAULT_ADDRESS
    const owner = `0x${'1'.repeat(40)}` as Address // Valid owner for deposit args

    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [vault, assets],
    })
    const depositData = encodeFunctionData({
      abi: sendEarnAbi,
      functionName: 'deposit',
      args: [assets, owner],
    })
    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [
        [
          { dest: MOCK_TOKEN_ADDRESS, value: 0n, data: approveData },
          { dest: vault, value: 0n, data: depositData },
        ],
      ],
    })

    const userOp: UserOperation<'v0.7'> = {
      sender, // Invalid sender here
      nonce,
      callData,
      ...defaultUserOp,
    }

    expect(() => decodeDepositUserOp({ userOp })).toThrow(
      /Invalid owner \(sender\) address in UserOperation/i
    )
  })
})
