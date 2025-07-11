import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals'
// @ts-expect-error I want to specifically import standard (web, non-native) version
import useCoinbaseOnramp from './useCoinbaseOnramp.ts'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getOnrampBuyUrl } from '@coinbase/onchainkit/fund'
import type { ReactNode } from 'react'

const queryClient = new QueryClient()

const mockGetOnrampBuyUrl = getOnrampBuyUrl as jest.Mock

jest.mock('@coinbase/onchainkit/fund', () => ({
  getOnrampBuyUrl: jest.fn().mockReturnValue('https://pay.coinbase.com'),
}))

describe('useCoinbaseOnramp', () => {
  const mockAddress = '0x123'
  const mockUrl = 'https://pay.coinbase.com'
  const mockProjectId = '0000000-0000-0000-0000-000000000000'
  const mockPartnerUserId = '0'
  const mockOrigin = 'https://pay.coinbase.com'

  const mockOnrampParams = {
    projectId: mockProjectId,
    address: mockAddress,
    partnerUserId: mockPartnerUserId,
  }

  const popupMock = {
    closed: false,
    close: jest.fn(function () {
      // @ts-expect-error - testing
      this.closed = true
    }),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockGetOnrampBuyUrl.mockImplementation(() => mockUrl)
    // @ts-expect-error - testing
    window.open = jest.fn().mockReturnValue(popupMock)
    window.addEventListener = jest.fn()
    window.removeEventListener = jest.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        origin: mockOrigin,
      },
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('handles successful onramp opening', async () => {
    const { result } = renderHook(() => useCoinbaseOnramp(mockOnrampParams), { wrapper })

    await act(async () => {
      await result.current.openOnramp(100)
    })

    expect(getOnrampBuyUrl).toBeCalledWith({
      addresses: { [mockAddress]: ['base'] },
      assets: ['USDC'],
      defaultPaymentMethod: 'CARD',
      fiatCurrency: 'USD',
      partnerUserId: mockPartnerUserId,
      presetFiatAmount: 100,
      projectId: mockProjectId,
    })
    expect(window.open).toHaveBeenCalledWith(mockUrl, 'Coinbase Onramp', 'width=600,height=800')
  })

  it('handles getOnrampBuyUrl errors correctly', async () => {
    const error = new Error('API Error')
    mockGetOnrampBuyUrl.mockImplementation(() => {
      throw error
    })

    const { result } = renderHook(() => useCoinbaseOnramp(mockOnrampParams), { wrapper })

    await act(async () => {
      await result.current.openOnramp(100)
    })

    expect(window.open).not.toHaveBeenCalled()
  })

  it('handles successful transaction completion', async () => {
    const { result } = renderHook(() => useCoinbaseOnramp(mockOnrampParams), { wrapper })

    // Open the onramp
    await act(async () => {
      result.current.openOnramp(100)
    })

    // Simulate success message
    await act(async () => {
      // Get the event listener callback
      // @ts-expect-error - testing
      const eventListenerCallback = (window.addEventListener as jest.Mock).mock.calls.find(
        (call) => call[0] === 'message'
      )[1]

      // Call the event listener with a success message
      // @ts-expect-error - testing
      eventListenerCallback({
        origin: mockOrigin,
        data: JSON.stringify({ data: { eventName: 'success' } }),
      })
    })

    // Status should now be success
    expect(result.current.status).toBe('success')
  })

  it('reject when user closes tab and no payment', async () => {
    const { result } = renderHook(() => useCoinbaseOnramp(mockOnrampParams), { wrapper })

    act(() => {
      result.current.openOnramp(100)
    })

    // Simulate that the popup is closed without payment submission.
    act(() => {
      popupMock.close()
      jest.runAllTimers()
    })

    // Wait until the error is updated in the mutation state.
    await waitFor(
      () => {
        expect(result.current.error?.message).toBe('Transaction canceled')
      },
      { timeout: 2000 }
    )
    expect(result.current.status).toBe('failed')
  })

  it('set payment_submitted', async () => {
    const { result } = renderHook(() => useCoinbaseOnramp(mockOnrampParams), { wrapper })

    act(() => {
      result.current.openOnramp(100)
    })

    // Simulate payment submitted event
    // @ts-expect-error - testing
    const eventListenerCallback = (window.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === 'message'
    )[1]

    act(() => {
      // @ts-expect-error - testing
      eventListenerCallback({
        origin: mockOrigin,
        data: JSON.stringify({ data: { pageRoute: '/v2/guest/onramp/order-submitted' } }),
      })
    })

    // Simulate user closing the popup
    act(() => {
      popupMock.close()
      jest.runAllTimers()
    })

    await waitFor(
      () => {
        expect(result.current.status).toBe('payment_submitted')
      },
      { timeout: 2000 }
    )

    expect(result.current.error).toBeNull()
  })
})
