import { useCoinbaseOnramp } from './useCoinbaseOnramp'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getOnrampBuyUrl } from '@coinbase/onchainkit/fund'
import type { ReactNode } from 'react'

const queryClient = new QueryClient()

const mockGetOnrampBuyUrl = getOnrampBuyUrl as jest.Mock
const mockRouterPush = jest.fn()

jest.mock('@coinbase/onchainkit/fund', () => ({
  getOnrampBuyUrl: jest.fn().mockReturnValue('https://example.com'),
}))

jest.mock('solito/router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
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
      this.closed = true
    }),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockGetOnrampBuyUrl.mockImplementation(() => mockUrl)
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
      redirectUrl: `${mockOrigin}/deposit/success/callback`,
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

  it('handles payment submitted status correctly', async () => {
    // Mock window.open to return a popup that's not closed
    const mockPopup = { closed: false }
    window.open = jest.fn().mockReturnValue(mockPopup)

    const { result } = renderHook(() => useCoinbaseOnramp(mockOnrampParams), { wrapper })

    // Open the onramp
    await act(async () => {
      result.current.openOnramp(100)
    })

    // Simulate payment submitted message
    await act(async () => {
      // Get the event listener callback
      const eventListenerCallback = (window.addEventListener as jest.Mock).mock.calls.find(
        (call) => call[0] === 'message'
      )[1]

      // Call the event listener with a payment submitted message
      eventListenerCallback({
        origin: mockOrigin,
        data: JSON.stringify({ data: { pageRoute: '/v2/guest/onramp/order-submitted' } }),
      })
    })

    // Status should now be payment_submitted
    expect(result.current.status).toBe('payment_submitted')
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
      const eventListenerCallback = (window.addEventListener as jest.Mock).mock.calls.find(
        (call) => call[0] === 'message'
      )[1]

      // Call the event listener with a success message
      eventListenerCallback({
        origin: mockOrigin,
        data: JSON.stringify({ data: { eventName: 'success' } }),
      })
    })

    // Status should now be success
    expect(result.current.status).toBe('success')
    expect(mockRouterPush).toHaveBeenCalledWith('/deposit/success')
  })

  it('rejects the transaction if the user closes the window without submitting payment', async () => {
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
        expect(result.current.error?.message).toBe('Transaction cancelled')
      },
      { timeout: 2000 }
    )
    expect(result.current.status).toBe('failed')
  })

  it('resolves the transaction if the payment was submitted and then the user closes the window', async () => {
    const { result } = renderHook(() => useCoinbaseOnramp(mockOnrampParams), { wrapper })

    act(() => {
      result.current.openOnramp(100)
    })

    // Simulate payment submitted event
    const eventListenerCallback = (window.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === 'message'
    )[1]

    act(() => {
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
