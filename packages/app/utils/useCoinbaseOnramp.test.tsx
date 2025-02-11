import { renderHook, act } from '@testing-library/react-hooks'
import { useCoinbaseOnramp } from './useCoinbaseOnramp'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getOnrampBuyUrl } from '@coinbase/onchainkit/fund'
import type { ReactNode } from 'react'

const queryClient = new QueryClient()

const mockGetOnrampBuyUrl = getOnrampBuyUrl as jest.Mock

jest.mock('@coinbase/onchainkit/fund', () => ({
  getOnrampBuyUrl: jest.fn().mockReturnValue('https://example.com'),
}))

describe('useCoinbaseOnramp', () => {
  const mockAddress = '0x123'
  const mockUrl = 'https://example.com'
  const mockProjectId = '0000000-0000-0000-0000-000000000000'
  const mockPartnerUserId = '0'
  const mockOrigin = 'https://send.app'

  const mockOnrampParams = {
    projectId: mockProjectId,
    address: mockAddress,
    partnerUserId: mockPartnerUserId,
  }

  beforeEach(() => {
    window.open = jest.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        origin: mockOrigin,
      },
    })
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
      redirectUrl: `${mockOrigin}/deposit/success`,
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
})
