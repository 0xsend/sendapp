import '@jest/globals'
import { act, render } from '@testing-library/react-native'
import { CoinbaseOnrampVerifyScreen } from './CoinbaseOnrampVerifyScreen'
import { fetchOnrampTransactionStatus } from '@coinbase/onchainkit/fund'
import { useSendAccount } from 'app/utils/send-accounts'

// Mock dependencies.
jest.mock('@coinbase/onchainkit/fund')
jest.mock('app/utils/send-accounts')

const MAX_TIMEOUT_MS = 180000

describe('CoinbaseOnrampVerifyScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('calls onFailure immediately when there is no sendAccount', () => {
    ;(useSendAccount as unknown as jest.Mock).mockReturnValue(null)
    const onFailure = jest.fn()
    const onSuccess = jest.fn()
    render(<CoinbaseOnrampVerifyScreen onFailure={onFailure} onSuccess={onSuccess} />)
    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(onFailure).toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('calls onSuccess when transaction status is successful', async () => {
    ;(useSendAccount as unknown as jest.Mock).mockReturnValue({ user_id: 'user123' })
    const onFailure = jest.fn()
    const onSuccess = jest.fn()
    render(<CoinbaseOnrampVerifyScreen onFailure={onFailure} onSuccess={onSuccess} />)
    // First call returns a pending status, second returns success.
    const mockFetch = fetchOnrampTransactionStatus as jest.Mock

    mockFetch.mockResolvedValueOnce({
      transactions: [{ status: 'ONRAMP_TRANSACTION_STATUS_SUCCESS' }],
    })

    await act(async () => {
      jest.advanceTimersByTime(200)
      await Promise.resolve()
    })
    expect(onSuccess).toHaveBeenCalled()
    expect(onFailure).not.toHaveBeenCalled()
  })

  it('calls onFailure when transaction status is failed', async () => {
    ;(useSendAccount as unknown as jest.Mock).mockReturnValue({ user_id: 'user123' })
    const onFailure = jest.fn()
    const onSuccess = jest.fn()
    render(<CoinbaseOnrampVerifyScreen onFailure={onFailure} onSuccess={onSuccess} />)
    const mockFetch = fetchOnrampTransactionStatus as jest.Mock
    mockFetch.mockResolvedValue({ transactions: [{ status: 'ONRAMP_TRANSACTION_STATUS_FAILED' }] })

    await act(async () => {
      jest.advanceTimersByTime(100)
      await Promise.resolve()
    })
    expect(onFailure).toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('calls onFailure after max timeout if no valid transactions', async () => {
    ;(useSendAccount as unknown as jest.Mock).mockReturnValue({ user_id: 'user123' })
    const onFailure = jest.fn()
    const onSuccess = jest.fn()
    render(<CoinbaseOnrampVerifyScreen onFailure={onFailure} onSuccess={onSuccess} />)
    // Always return no transactions.
    const mockFetch = fetchOnrampTransactionStatus as jest.Mock
    mockFetch.mockResolvedValue({ transactions: null })

    await act(async () => {
      jest.advanceTimersByTime(MAX_TIMEOUT_MS)
      await Promise.resolve()
    })
    expect(onFailure).toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('calls onFailure if fetchOnrampTransactionStatus throws an error', async () => {
    ;(useSendAccount as unknown as jest.Mock).mockReturnValue({ user_id: 'user123' })
    const onFailure = jest.fn()
    const onSuccess = jest.fn()
    render(<CoinbaseOnrampVerifyScreen onFailure={onFailure} onSuccess={onSuccess} />)
    const mockFetch = fetchOnrampTransactionStatus as jest.Mock
    mockFetch.mockRejectedValue(new Error('Network error'))

    await act(async () => {
      jest.advanceTimersByTime(100)
      await Promise.resolve()
    })
    expect(onFailure).toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
