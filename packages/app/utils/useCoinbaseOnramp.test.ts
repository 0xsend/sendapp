import { renderHook, act } from '@testing-library/react-hooks'
import { useCoinbaseOnramp } from './useCoinbaseOnramp'
import { api } from './api'

jest.mock('./api', () => ({
  api: {
    coinbase: {
      getOnrampUrl: {
        useMutation: jest.fn().mockReturnValue({
          mutateAsync: jest.fn(),
        }),
      },
      getQuote: {
        useMutation: jest.fn(),
      },
    },
  },
}))

describe('useCoinbaseOnramp', () => {
  const mockAddress = '0x123'
  const mockUrl = 'https://example.com'

  beforeEach(() => {
    window.open = jest.fn()
  })

  it('handles successful onramp opening', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({ url: mockUrl })
    ;(api.coinbase.getOnrampUrl.useMutation as jest.Mock).mockReturnValue({
      mutateAsync,
    })

    const { result } = renderHook(() => useCoinbaseOnramp())

    await act(async () => {
      await result.current.openOnramp(mockAddress)
    })

    expect(mutateAsync).toHaveBeenCalledWith({
      address: mockAddress,
      blockchains: ['base'],
    })
    expect(window.open).toHaveBeenCalledWith(mockUrl, '_blank')
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('handles API errors correctly', async () => {
    const error = new Error('API Error')
    const mutateAsync = jest.fn().mockRejectedValue(error)
    ;(api.coinbase.getOnrampUrl.useMutation as jest.Mock).mockReturnValue({
      mutateAsync,
    })

    const { result } = renderHook(() => useCoinbaseOnramp())

    await act(async () => {
      await result.current.openOnramp(mockAddress)
    })

    expect(window.open).not.toHaveBeenCalled()
    expect(result.current.error).toBe('API Error')
    expect(result.current.isLoading).toBe(false)
  })

  it('passes optional parameters correctly', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({ url: mockUrl })
    ;(api.coinbase.getOnrampUrl.useMutation as jest.Mock).mockReturnValue({
      mutateAsync,
    })

    const { result } = renderHook(() => useCoinbaseOnramp())
    const params = {
      quoteId: 'quote123',
      defaultAsset: 'USDC',
      presetFiatAmount: 100,
    }

    await act(async () => {
      await result.current.openOnramp(mockAddress, params)
    })

    expect(mutateAsync).toHaveBeenCalledWith({
      address: mockAddress,
      blockchains: ['base'],
      ...params,
    })
  })
})
