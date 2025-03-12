import { describe } from '@jest/globals'
import { sendAccountAbi } from '@my/wagmi'
import { decodeTransferUserOp } from './decodeTransferUserOp'
import { encodeFunctionData, erc20Abi } from 'viem'

jest.mock('./userop', () => ({
  entrypoint: {
    address: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  },
}))
jest.mock('wagmi')
jest.mock('@my/wagmi', () => ({
  __esModule: true,
  ...jest.requireActual('@my/wagmi'),
  tokenPaymasterAddress: {
    1: '0xfbbC7F7da495c9957d491F40482710DC5DFd7d85',
    1337: '0xfbbC7F7da495c9957d491F40482710DC5DFd7d85',
    8453: '0xfbbC7F7da495c9957d491F40482710DC5DFd7d85',
    84532: '0xfbbC7F7da495c9957d491F40482710DC5DFd7d85',
    845337: '0xfbbC7F7da495c9957d491F40482710DC5DFd7d85',
  },
}))

const defaultUserOp = {
  callGasLimit: 100000n,
  maxFeePerGas: 10000000n,
  maxPriorityFeePerGas: 10000000n,
  paymaster: '0xfbbC7F7da495c9957d491F40482710DC5DFd7d85',
  paymasterData: '0x',
  paymasterPostOpGasLimit: 50000n,
  paymasterVerificationGasLimit: 150000n,
  preVerificationGas: 70000n,
  signature: '0x123',
  verificationGasLimit: 550000n,
} as const

describe('decodeTransferUserOp', () => {
  it('should decode ETH transfer user operation', () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const to = `0x${'2'.repeat(40)}` as `0x${string}`
    const amount = 1n
    const nonce = 0n
    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [
        [
          {
            dest: to,
            value: amount,
            data: '0x',
          },
        ],
      ],
    })

    const userOp = {
      sender,
      nonce,
      callData,
      ...defaultUserOp,
    }

    const result = decodeTransferUserOp({ userOp })

    expect(result).toEqual({
      from: sender,
      to,
      token: 'eth',
      amount,
    })
  })

  it('should decode ERC20 transfer user operation', () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const to = `0x${'2'.repeat(40)}` as `0x${string}`
    const token = `0x${'3'.repeat(40)}` as `0x${string}`
    const amount = 1n
    const nonce = 0n
    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [
        [
          {
            dest: token,
            value: 0n,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'transfer',
              args: [to, amount],
            }),
          },
        ],
      ],
    })
    const userOp = {
      sender,
      nonce,
      callData,
      ...defaultUserOp,
    }

    const result = decodeTransferUserOp({ userOp })

    expect(result).toEqual({
      from: sender,
      to,
      token,
      amount,
    })
  })
  it('should throw when callData is invalid hex', () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const userOp = {
      sender,
      nonce: 0n,
      callData: '0xinvalid' as `0x${string}`,
      ...defaultUserOp,
    }

    expect(() => decodeTransferUserOp({ userOp })).toThrow()
  })

  it('should throw when function signature is not found', () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const userOp = {
      sender,
      nonce: 0n,
      callData: '0x12345678' as `0x${string}`, // Invalid function selector
      ...defaultUserOp,
    }

    expect(() => decodeTransferUserOp({ userOp })).toThrow('Encoded function signature')
  })

  it('should throw when trying to decode invalid ERC20 transfer data', () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const token = `0x${'3'.repeat(40)}` as `0x${string}`

    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [
        [
          {
            dest: token,
            value: 0n,
            data: '0x12345678' as `0x${string}`, // Invalid ERC20 data
          },
        ],
      ],
    })

    const userOp = {
      sender,
      nonce: 0n,
      callData,
      ...defaultUserOp,
    }

    expect(() => decodeTransferUserOp({ userOp })).toThrow('Encoded function signature')
  })

  it('should throw when executeBatch has no calls', () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [[]], // Empty calls array
    })

    const userOp = {
      sender,
      nonce: 0n,
      callData,
      ...defaultUserOp,
    }

    expect(() => decodeTransferUserOp({ userOp })).toThrow()
  })

  it('should throw when ERC20 transfer data is malformed', () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const token = `0x${'3'.repeat(40)}` as `0x${string}`

    // Using transfer function selector with invalid data
    const invalidTransferData = '0xa9059cbb000000' as `0x${string}`

    const callData = encodeFunctionData({
      abi: sendAccountAbi,
      functionName: 'executeBatch',
      args: [
        [
          {
            dest: token,
            value: 0n,
            data: invalidTransferData,
          },
        ],
      ],
    })

    const userOp = {
      sender,
      nonce: 0n,
      callData,
      ...defaultUserOp,
    }

    expect(() => decodeTransferUserOp({ userOp })).toThrow()
  })
})
