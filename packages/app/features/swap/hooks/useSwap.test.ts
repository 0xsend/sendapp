import { describe, beforeEach, it, jest, expect } from '@jest/globals'
import { renderHook } from '@testing-library/react-hooks'
import { encodeFunctionData } from 'viem'
import { useSwap } from './useSwap'
import { useSendAccount } from 'app/utils/send-accounts'
import { useUserOp } from 'app/utils/userop'
import { useUSDCFees } from 'app/utils/useUSDCFees'

jest.mock('app/utils/send-accounts', () => ({
  useSendAccount: jest.fn(),
}))

jest.mock('app/utils/userop', () => ({
  useUserOp: jest.fn(),
}))

jest.mock('app/utils/useUSDCFees', () => ({
  useUSDCFees: jest.fn(),
}))

jest.mock('viem', () => ({
  encodeFunctionData: jest.fn(),
  erc20Abi: 'mockedAbi',
}))

const useSendAccountMock = useSendAccount as unknown as jest.Mock
const useUserOpMock = useUserOp as unknown as jest.Mock
const useUSDCFeesMock = useUSDCFees as unknown as jest.Mock
const encodeFunctionDataMock = encodeFunctionData as unknown as jest.Mock

describe('useSwap', () => {
  const mockAddress = '0x0000000000000000000000000000000000000000'
  const mockRouterAddress = '0x1111111111111111111111111111111111111111'
  const mockTokenAddress = '0x2222222222222222222222222222222222222222'
  const mockSwapCallData = '0x4444444444444444444444444444444444444444'
  const mockEncodeFunctionDataResult = '0x5555555555555555555555555555555555555555'
  const mockAmount = 1000000000000000000n

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call userOp hook with undefined when token is missing', () => {
    useSendAccountMock.mockReturnValue({ data: { address: mockAddress } })

    renderHook(() =>
      useSwap({
        swapCallData: mockSwapCallData,
        amount: mockAmount,
        routerAddress: mockRouterAddress,
      })
    )

    expect(useUserOpMock).toHaveBeenCalledWith({ calls: undefined, sender: mockAddress })
  })

  it('should call userOp hook with undefined when callData is missing', () => {
    useSendAccountMock.mockReturnValue({ data: { address: mockAddress } })

    renderHook(() =>
      useSwap({
        amount: mockAmount,
        token: mockTokenAddress,
        routerAddress: mockRouterAddress,
      })
    )

    expect(useUserOpMock).toHaveBeenCalledWith({ calls: undefined, sender: mockAddress })
  })

  it('should call userOp hook with undefined when amount is missing', () => {
    useSendAccountMock.mockReturnValue({ data: { address: mockAddress } })

    renderHook(() =>
      useSwap({
        swapCallData: mockSwapCallData,
        token: mockTokenAddress,
        routerAddress: mockRouterAddress,
      })
    )

    expect(useUserOpMock).toHaveBeenCalledWith({ calls: undefined, sender: mockAddress })
  })

  it('should call userOp hook with undefined when routerAddress is missing', () => {
    useSendAccountMock.mockReturnValue({ data: { address: mockAddress } })

    renderHook(() =>
      useSwap({
        amount: mockAmount,
        swapCallData: mockSwapCallData,
        token: mockTokenAddress,
      })
    )

    expect(useUserOpMock).toHaveBeenCalledWith({ calls: undefined, sender: mockAddress })
  })

  it('should call userOp and fee hooks with proper data when token is not eth', () => {
    useSendAccountMock.mockReturnValue({ data: { address: mockAddress } })
    encodeFunctionDataMock.mockReturnValue(mockEncodeFunctionDataResult)
    useUserOpMock.mockReturnValue({ data: { field: 'mockedValue' } })

    renderHook(() =>
      useSwap({
        token: mockTokenAddress,
        amount: mockAmount,
        swapCallData: mockSwapCallData,
        routerAddress: mockRouterAddress,
      })
    )

    expect(encodeFunctionDataMock).toHaveBeenCalledWith({
      abi: 'mockedAbi',
      functionName: 'approve',
      args: [mockRouterAddress, mockAmount],
    })
    expect(useUserOpMock).toHaveBeenCalledWith({
      sender: mockAddress,
      calls: [
        {
          dest: mockTokenAddress,
          value: 0n,
          data: mockEncodeFunctionDataResult,
        },
        {
          dest: mockRouterAddress,
          value: 0n,
          data: mockSwapCallData,
        },
      ],
    })
    expect(useUSDCFeesMock).toHaveBeenCalledWith({ userOp: { field: 'mockedValue' } })
  })

  it('should call userOp and fee hooks with proper data when token is eth', () => {
    useSendAccountMock.mockReturnValue({ data: { address: mockAddress } })
    useUserOpMock.mockReturnValue({ data: { field: 'mockedValue' } })

    renderHook(() =>
      useSwap({
        token: 'eth',
        amount: mockAmount,
        swapCallData: mockSwapCallData,
        routerAddress: mockRouterAddress,
      })
    )

    expect(useUserOpMock).toHaveBeenCalledWith({
      sender: mockAddress,
      calls: [
        {
          dest: mockRouterAddress,
          value: mockAmount,
          data: mockSwapCallData,
        },
      ],
    })
    expect(useUSDCFeesMock).toHaveBeenCalledWith({ userOp: { field: 'mockedValue' } })
  })

  it('should return proper fields', () => {
    useSendAccountMock.mockReturnValue({ data: { address: mockAddress } })
    useUserOpMock.mockReturnValue({
      data: { field: 'mockedUserOp' },
      error: new Error('UserOp error'),
      isLoading: true,
    })
    useUSDCFeesMock.mockReturnValue({
      data: { field: 'mockedFees' },
      error: new Error('USDC Fees error'),
      isLoading: true,
    })

    const { result } = renderHook(() =>
      useSwap({
        token: 'eth',
        amount: mockAmount,
        swapCallData: mockSwapCallData,
        routerAddress: mockRouterAddress,
      })
    )

    expect(result.current.userOp).toEqual({ field: 'mockedUserOp' })
    expect(result.current.userOpError).toEqual(new Error('UserOp error'))
    expect(result.current.isLoadingUserOp).toBe(true)
    expect(result.current.usdcFees).toEqual({ field: 'mockedFees' })
    expect(result.current.usdcFeesError).toEqual(new Error('USDC Fees error'))
    expect(result.current.isLoadingUSDCFees).toBe(true)
  })
})
