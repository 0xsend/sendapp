import { describe, expect, test, jest, beforeEach } from '@jest/globals'
import { renderHook } from '@testing-library/react-native'
import { usePaymasterAllowanceCheck } from './usePaymasterAllowanceCheck'
import { parseUnits } from 'viem'
import { useReadUsdcAllowance } from '@my/wagmi'

// Mock wagmi hook
jest.mock('@my/wagmi', () => ({
  useReadUsdcAllowance: jest.fn(),
  tokenPaymasterAddress: {
    8453: '0x592e1224D203Be4214B15e205F6081FbbaCFcD2D',
    84532: '0xD600b7f9E0A2CBC4215A0CCC116342Dccbd666eB',
  },
}))

const mockUseReadUsdcAllowance = useReadUsdcAllowance as jest.MockedFunction<
  typeof useReadUsdcAllowance
>

describe('usePaymasterAllowanceCheck', () => {
  const BASE_SEPOLIA_CHAIN_ID = 84532
  const BASE_MAINNET_CHAIN_ID = 8453
  const MOCK_SEND_ACCOUNT = '0x1234567890123456789012345678901234567890'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns needsApproval: false when allowance is sufficient on Base Sepolia', () => {
    mockUseReadUsdcAllowance.mockReturnValue({
      data: parseUnits('100', 6), // 100 USDC
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReadUsdcAllowance>)

    const { result } = renderHook(() =>
      usePaymasterAllowanceCheck({
        chainId: BASE_SEPOLIA_CHAIN_ID,
        sendAccount: MOCK_SEND_ACCOUNT,
      })
    )

    expect(result.current.needsApproval).toBe(false)
  })

  test('returns needsApproval: true when allowance is below threshold on Base Sepolia', () => {
    mockUseReadUsdcAllowance.mockReturnValue({
      data: parseUnits('50', 6), // 50 USDC, below 100 threshold
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReadUsdcAllowance>)

    const { result } = renderHook(() =>
      usePaymasterAllowanceCheck({
        chainId: BASE_SEPOLIA_CHAIN_ID,
        sendAccount: MOCK_SEND_ACCOUNT,
      })
    )

    expect(result.current.needsApproval).toBe(true)
  })

  test('returns needsApproval: false on Base Mainnet when feature flag is disabled', () => {
    mockUseReadUsdcAllowance.mockReturnValue({
      data: 0n,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReadUsdcAllowance>)

    const { result } = renderHook(() =>
      usePaymasterAllowanceCheck({
        chainId: BASE_MAINNET_CHAIN_ID,
        sendAccount: MOCK_SEND_ACCOUNT,
      })
    )

    expect(result.current.needsApproval).toBe(false)
  })

  test('returns needsApproval: false on chains without tokenPaymaster configured', () => {
    mockUseReadUsdcAllowance.mockReturnValue({
      data: 0n,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReadUsdcAllowance>)

    const { result } = renderHook(() =>
      usePaymasterAllowanceCheck({
        chainId: 1, // Ethereum mainnet - no tokenPaymaster configured
        sendAccount: MOCK_SEND_ACCOUNT,
      })
    )

    expect(result.current.needsApproval).toBe(false)
  })

  test('verifies allowance threshold logic at exactly 100 USDC', () => {
    mockUseReadUsdcAllowance.mockReturnValue({
      data: parseUnits('100', 6), // Exactly 100 USDC
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReadUsdcAllowance>)

    const { result } = renderHook(() =>
      usePaymasterAllowanceCheck({
        chainId: BASE_SEPOLIA_CHAIN_ID,
        sendAccount: MOCK_SEND_ACCOUNT,
      })
    )

    expect(result.current.needsApproval).toBe(false)
  })

  test('verifies allowance threshold logic at 99.999999 USDC', () => {
    mockUseReadUsdcAllowance.mockReturnValue({
      data: parseUnits('100', 6) - 1n, // Just below 100 USDC
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReadUsdcAllowance>)

    const { result } = renderHook(() =>
      usePaymasterAllowanceCheck({
        chainId: BASE_SEPOLIA_CHAIN_ID,
        sendAccount: MOCK_SEND_ACCOUNT,
      })
    )

    expect(result.current.needsApproval).toBe(true)
  })

  test('handles loading state properly', () => {
    mockUseReadUsdcAllowance.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useReadUsdcAllowance>)

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
    mockUseReadUsdcAllowance.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useReadUsdcAllowance>)

    const { result } = renderHook(() =>
      usePaymasterAllowanceCheck({
        chainId: BASE_SEPOLIA_CHAIN_ID,
        sendAccount: undefined,
      })
    )

    expect(result.current.needsApproval).toBe(false)
  })
})
