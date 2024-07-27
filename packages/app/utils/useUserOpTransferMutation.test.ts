import { describe, test } from '@jest/globals'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { baseMainnetBundlerClient, sendAccountAbi } from '@my/wagmi'
import { signUserOp } from './signUserOp'
import { encodeFunctionData, erc20Abi } from 'viem'
import { useUserOpTransferMutation, useGenerateTransferUserOp } from './useUserOpTransferMutation'
import { Wrapper } from './__mocks__/Wrapper'
jest.mock('./signUserOp')
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
  baseMainnetClient: {
    chain: {
      id: 845337,
    },
    simulateContract: jest.fn().mockResolvedValue({}),
    getGasPrice: jest.fn().mockReturnValue(Promise.resolve(BigInt(0))),
    estimateFeesPerGas: jest.fn().mockResolvedValue(
      Promise.resolve({
        maxFeePerGas: BigInt(0),
        maxPriorityFeePerGas: BigInt(0),
      })
    ),
    call: jest.fn().mockResolvedValue({}),
  },
  baseMainnetBundlerClient: {
    sendUserOperation: jest.fn(),
    waitForUserOperationReceipt: jest.fn().mockResolvedValue({ success: true }),
    estimateUserOperationGas: jest.fn().mockReturnValue(
      Promise.resolve({
        verificationGasLimit: BigInt(0),
        callGasLimit: BigInt(0),
        preVerificationGas: BigInt(0),
      })
    ),
  },
  entryPointAddress: {
    1: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    1337: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    8453: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    84532: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    845337: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
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

describe('useUserOpTransferMutation', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    // @ts-expect-error mock
    baseMainnetBundlerClient.sendUserOperation.mockReset()
    // @ts-expect-error mock
    baseMainnetBundlerClient.waitForUserOperationReceipt.mockReset()
    // @ts-expect-error mock
    signUserOp.mockReset()
  })

  test('should send user op transfer', async () => {
    const userOp = {
      sender: `0x${'1'.repeat(40)}` as `0x${string}`,
      nonce: 0n,
      callData: '0x' as `0x${string}`,
      ...defaultUserOp,
    }
    baseMainnetBundlerClient.sendUserOperation = jest.fn().mockImplementation((_args) => {
      expect(_args).toStrictEqual({
        userOperation: userOp,
      })
      return Promise.resolve('0x123')
    })
    // @ts-expect-error mock
    baseMainnetBundlerClient.waitForUserOperationReceipt.mockResolvedValue({ success: true })
    // @ts-expect-error mock
    signUserOp.mockResolvedValue('0x123')

    const { result } = renderHook(() => useUserOpTransferMutation(), {
      wrapper: Wrapper,
    })

    expect(result.current).toBeDefined()
    await act(async () => {
      await result.current.mutateAsync({ userOp, validUntil: 0, webauthnCreds: [] })
      jest.runAllTimers()
    })
    expect(signUserOp).toHaveBeenCalledTimes(1)
    expect(baseMainnetBundlerClient.sendUserOperation).toHaveBeenCalledTimes(1)
    expect(baseMainnetBundlerClient.waitForUserOperationReceipt).toHaveBeenCalledTimes(1)
  })
})

describe('useGenerateTransferUserOp', () => {
  test('should generate user op for native currency transfer', async () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const to = `0x${'2'.repeat(40)}` as `0x${string}`
    const amount = 1n
    const nonce = 0n

    const { result } = renderHook(
      () => useGenerateTransferUserOp({ sender, to, token: undefined, amount, nonce }),
      {
        wrapper: Wrapper,
      }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current).toBeDefined()
    const userOp = result.current.data
    expect(userOp).toBeDefined()
    expect(userOp?.sender).toBe(sender)
    expect(userOp?.nonce).toBe(nonce)
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
    expect(userOp?.callData).toBe(callData)
  })

  test('should generate user op for ERC20 token transfer', async () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const to = `0x${'2'.repeat(40)}` as `0x${string}`
    const token = `0x${'3'.repeat(40)}` as `0x${string}`
    const amount = 1n
    const nonce = 0n

    const { result } = renderHook(
      () => useGenerateTransferUserOp({ sender, to, token, amount, nonce }),
      {
        wrapper: Wrapper,
      }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current).toBeDefined()
    const userOp = result.current.data
    expect(userOp).toBeDefined()
    expect(userOp?.sender).toBe(sender)
    expect(userOp?.nonce).toBe(nonce)
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
    expect(userOp?.callData).toBe(callData)
  })

  test('should return error when sender is not a valid address', async () => {
    const sender = `0x${'1'.repeat(39)}` as `0x${string}`
    const to = `0x${'2'.repeat(40)}` as `0x${string}`
    const amount = 1n
    const nonce = 0n

    const { result } = renderHook(
      () => useGenerateTransferUserOp({ sender, to, token: undefined, amount, nonce }),
      {
        wrapper: Wrapper,
      }
    )
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current).toBeDefined()
    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toBe('Invalid send account address')
  })

  test('should return error when to is not a valid address', async () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const to = `0x${'2'.repeat(39)}` as `0x${string}`
    const amount = 1n
    const nonce = 0n

    const { result } = renderHook(
      () => useGenerateTransferUserOp({ sender, to, token: undefined, amount, nonce }),
      {
        wrapper: Wrapper,
      }
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current).toBeDefined()
    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toBe('Invalid to address')
  })

  test('should return error when token is not a valid address', async () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const to = `0x${'2'.repeat(40)}` as `0x${string}`
    const token = `0x${'3'.repeat(39)}` as `0x${string}`
    const amount = 1n
    const nonce = 0n

    const { result } = renderHook(
      () => useGenerateTransferUserOp({ sender, to, token, amount, nonce }),
      {
        wrapper: Wrapper,
      }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current).toBeDefined()
    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toBe('Invalid token address')
  })

  test('should return error when amount is not a bigint', async () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const to = `0x${'2'.repeat(40)}` as `0x${string}`
    const amount = 1 as unknown as bigint
    const nonce = 0n

    const { result } = renderHook(
      () => useGenerateTransferUserOp({ sender, to, token: undefined, amount, nonce }),
      {
        wrapper: Wrapper,
      }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current).toBeDefined()
    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toBe('Invalid amount')
  })

  test('should return error when amount is less than or equal to 0', async () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const to = `0x${'2'.repeat(40)}` as `0x${string}`
    const amount = 0n
    const nonce = 0n

    const { result } = renderHook(
      () => useGenerateTransferUserOp({ sender, to, token: undefined, amount, nonce }),
      {
        wrapper: Wrapper,
      }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current).toBeDefined()
    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toBe('Invalid amount')
  })

  test('should return error when nonce is not a bigint', async () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const to = `0x${'2'.repeat(40)}` as `0x${string}`
    const amount = 1n
    const nonce = 0 as unknown as bigint

    const { result } = renderHook(
      () => useGenerateTransferUserOp({ sender, to, token: undefined, amount, nonce }),
      {
        wrapper: Wrapper,
      }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current).toBeDefined()
    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toBe('Invalid nonce')
  })

  test('should return error when nonce is less than 0', async () => {
    const sender = `0x${'1'.repeat(40)}` as `0x${string}`
    const to = `0x${'2'.repeat(40)}` as `0x${string}`
    const amount = 1n
    const nonce = -1n

    const { result } = renderHook(
      () => useGenerateTransferUserOp({ sender, to, token: undefined, amount, nonce }),
      {
        wrapper: Wrapper,
      }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current).toBeDefined()
    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toBe('Invalid nonce')
  })
})
