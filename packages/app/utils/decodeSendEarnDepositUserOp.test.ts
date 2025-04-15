import { describe, expect, it, jest } from '@jest/globals'
import { sendAccountAbi, sendEarnAbi, sendEarnUsdcFactoryAbi } from '@my/wagmi'
import type { UserOperation } from 'permissionless'
import { encodeFunctionData, erc20Abi, zeroHash, type Address, type Hex } from 'viem'
import { decodeSendEarnDepositUserOp } from './decodeSendEarnDepositUserOp'

jest.unmock('@my/wagmi')

const MOCK_VAULT_ADDRESS = `0x${'3'.repeat(40)}` as Address
const MOCK_FACTORY_ADDRESS = `0x${'5'.repeat(40)}` as Address
const MOCK_TOKEN_ADDRESS = `0x${'4'.repeat(40)}` as Address // Token being deposited

const defaultUserOp: Omit<UserOperation<'v0.7'>, 'sender' | 'nonce' | 'callData'> = {
  callGasLimit: 100000n,
  verificationGasLimit: 550000n,
  preVerificationGas: 70000n,
  maxFeePerGas: 10000000n,
  maxPriorityFeePerGas: 10000000n,
  signature: '0x123', // Placeholder signature
}

describe('decodeSendEarnDepositUserOp', () => {
  it('should correctly decode a valid direct deposit UserOperation (VAULT_DEPOSIT_SIG)', () => {
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

    const result = decodeSendEarnDepositUserOp({ userOp })

    expect(result).toEqual({
      type: 'vault',
      owner,
      assets,
      vault,
    })
  })

  it('should correctly decode a valid factory deposit UserOperation (FACTORY_DEPOSIT_SIG)', () => {
    const sender = `0x${'1'.repeat(40)}` as Address
    const referrer = `0x${'2'.repeat(40)}` as Address
    const assets = 2000n // Amount to deposit
    const nonce = 1n
    const factory = MOCK_FACTORY_ADDRESS

    // 1. Encode the approve call (to the factory this time)
    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [factory, assets],
    })

    // 2. Encode the createAndDeposit call
    const createDepositData = encodeFunctionData({
      abi: sendEarnUsdcFactoryAbi,
      functionName: 'createAndDeposit',
      args: [referrer, zeroHash, assets], // Assuming createAndDeposit(address referrer, bytes32 salt, uint256 assets)
    })

    // 3. Encode the executeBatch call containing approve and createAndDeposit
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
            dest: factory, // Depositing via the factory
            value: 0n,
            data: createDepositData,
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

    const result = decodeSendEarnDepositUserOp({ userOp })

    // For factory deposits, the owner is the userOp.sender
    expect(result).toEqual({
      type: 'factory',
      owner: sender,
      factory,
      referrer,
      assets,
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
    // This test uses decodeSendAccountExecuteBatchCalls internally, which handles hex validation
    expect(() => decodeSendEarnDepositUserOp({ userOp })).toThrow(
      /Encoded function signature "0xinvalid" not found on AB/i
    )
  })

  it('should throw if callData is not for executeBatch', () => {
    const sender = `0x${'1'.repeat(40)}` as Address
    const userOp: UserOperation<'v0.7'> = {
      sender,
      nonce: 0n,
      callData: '0x12345678' as Hex, // Incorrect function selector
      ...defaultUserOp,
    }
    expect(() => decodeSendEarnDepositUserOp({ userOp })).toThrow(
      /Encoded function signature "0x12345678" not found on ABI/i
    )
  })

  it('should throw if executeBatch has zero calls', () => {
    const sender = `0x${'1'.repeat(40)}` as Address
    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [[]], // Empty calls array
    })
    const userOp: UserOperation<'v0.7'> = {
      sender,
      nonce: 0n,
      callData,
      ...defaultUserOp,
    }
    expect(() => decodeSendEarnDepositUserOp({ userOp })).toThrow(/Invalid number of calls/i)
  })

  it('should throw if no deposit call (VAULT_DEPOSIT_SIG or FACTORY_DEPOSIT_SIG) is found', () => {
    const sender = `0x${'1'.repeat(40)}` as Address
    // Using a generic transfer call instead of deposit/createAndDeposit
    // Moved transferData declaration outside encodeFunctionData
    const transferData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [`0x${'9'.repeat(40)}`, 1n],
    })
    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [
        [
          { dest: MOCK_TOKEN_ADDRESS, value: 0n, data: '0x' /* approve placeholder */ },
          { dest: MOCK_TOKEN_ADDRESS, value: 0n, data: transferData /* wrong call type */ },
        ],
      ],
    })
    const userOp: UserOperation<'v0.7'> = {
      sender,
      nonce: 0n,
      callData,
      ...defaultUserOp,
    }
    // The assert checks for exactly one deposit call
    expect(() => decodeSendEarnDepositUserOp({ userOp })).toThrow(
      /Expected exactly one deposit call in batch/i
    )
  })

  it('should throw if the found deposit call data is malformed (cannot be decoded)', () => {
    // Removed redeclaration of sender and vault
    const sender = `0x${'1'.repeat(40)}` as Address
    const vault = MOCK_VAULT_ADDRESS
    // Use the correct function selector but provide invalid data afterwards
    const malformedDepositData = `${'0x6e553f65'}${'11'.repeat(10)}` as Hex // VAULT_DEPOSIT_SIG + garbage

    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [
        [
          { dest: MOCK_TOKEN_ADDRESS, value: 0n, data: '0x' /* approve placeholder */ },
          { dest: vault, value: 0n, data: malformedDepositData },
        ],
      ],
    })
    const userOp: UserOperation<'v0.7'> = { sender, nonce: 0n, callData, ...defaultUserOp }

    // viem's decodeFunctionData should throw here
    expect(() => decodeSendEarnDepositUserOp({ userOp })).toThrow(
      /Data size of 10 bytes is too small for given parameters/i
    )
  })
})
