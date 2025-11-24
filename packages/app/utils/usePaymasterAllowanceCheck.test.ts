import { describe, expect, test, jest, beforeEach } from '@jest/globals'
import { renderHook } from '@testing-library/react-native'
import { usePaymasterAllowanceCheck } from './usePaymasterAllowanceCheck'
import { parseUnits } from 'viem'

// Mock wagmi hook
const mockUseReadUsdcAllowance = jest.fn()
jest.mock('@my/wagmi', () => ({
  useReadUsdcAllowance: jest.fn(),
  tokenPaymasterAddress: {
    84532: '0xD600b7f9E0A2CBC4215A0CCC116342Dccbd666eB',
  },
}))

describe('usePaymasterAllowanceCheck', () => {
  const BASE_SEPOLIA_CHAIN_ID = 84532
  const MAINNET_CHAIN_ID = 8453
  const MOCK_SEND_ACCOUNT = '0x1234567890123456789012345678901234567890'

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseReadUsdcAllowance.mockReset()
  })

  test('returns needsApproval: false when allowance is sufficient', () => {
    const { useReadUsdcAllowance } = require('@my/wagmi')
    useReadUsdcAllowance.mockReturnValue({
      data: parseUnits('100', 6), // 100 USDC
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() =>
      usePaymasterAllowanceCheck({
        chainId: BASE_SEPOLIA_CHAIN_ID,
        sendAccount: MOCK_SEND_ACCOUNT,
      })
    )

    expect(result.current.needsApproval).toBe(false)
  })

  test('returns needsApproval: true when allowance is below threshold', () => {
    const { useReadUsdcAllowance } = require('@my/wagmi')
    useReadUsdcAllowance.mockReturnValue({
      data: parseUnits('50', 6), // 50 USDC, below 100 threshold
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() =>
      usePaymasterAllowanceCheck({
        chainId: BASE_SEPOLIA_CHAIN_ID,
        sendAccount: MOCK_SEND_ACCOUNT,
      })
    )

    expect(result.current.needsApproval).toBe(true)
  })

  test('returns needsApproval: false on non-Base Sepolia chains', () => {
    const { useReadUsdcAllowance } = require('@my/wagmi')
    useReadUsdcAllowance.mockReturnValue({
      data: 0n,
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() =>
      usePaymasterAllowanceCheck({
        chainId: MAINNET_CHAIN_ID,
        sendAccount: MOCK_SEND_ACCOUNT,
      })
    )

    expect(result.current.needsApproval).toBe(false)
  })

  test('handles loading state properly', () => {
    const { useReadUsdcAllowance } = require('@my/wagmi')
    useReadUsdcAllowance.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    const { result } = renderHook(() =>
      usePaymasterAllowanceCheck({
        chainId: BASE_SEPOLIA_CHAIN_ID,
        sendAccount: MOCK_SEND_ACCOUNT,
      })
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.needsApproval).toBe(false)
  })

  test('handles missing send account', () => {
    const { useReadUsdcAllowance } = require('@my/wagmi')
    useReadUsdcAllowance.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() =>
      usePaymasterAllowanceCheck({
        chainId: BASE_SEPOLIA_CHAIN_ID,
        sendAccount: undefined,
      })
    )

    expect(result.current.needsApproval).toBe(false)
  })
})
