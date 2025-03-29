import '@jest/globals'
import { act, render } from '@testing-library/react-native'
import { CoinbaseOnrampVerifyScreen } from './CoinbaseOnrampVerifyScreen'
import { fetchOnrampTransactionStatus } from '@coinbase/onchainkit/fund'
import { useSendAccount } from 'app/utils/send-accounts'
import { Provider } from 'app/__mocks__/app/provider'

// Mock dependencies.
jest.mock('@coinbase/onchainkit/fund', () => ({
  fetchOnrampTransactionStatus: jest.fn(),
}))

jest.mock('app/utils/send-accounts', () => ({
  useSendAccount: jest.fn(),
}))

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
    ;(useSendAccount as unknown as jest.Mock).mockReturnValue({ data: { user_id: '' } })
    const onFailure = jest.fn()
    const onSuccess = jest.fn()
    render(
      <Provider>
        <CoinbaseOnrampVerifyScreen onFailure={onFailure} onSuccess={onSuccess} />
      </Provider>
    )
    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(onFailure).toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('calls onSuccess when transaction status is successful', async () => {
    ;(useSendAccount as unknown as jest.Mock).mockReturnValue({ data: { user_id: 'user123' } })
    ;(fetchOnrampTransactionStatus as jest.Mock).mockResolvedValue({
      transactions: [{ status: 'ONRAMP_TRANSACTION_STATUS_SUCCESS' }],
    })
    const onFailure = jest.fn()
    const onSuccess = jest.fn()
    render(<CoinbaseOnrampVerifyScreen onFailure={onFailure} onSuccess={onSuccess} />)

    await act(async () => {
      jest.advanceTimersByTime(1000)
      await Promise.resolve()
    })
    expect(onSuccess).toHaveBeenCalled()
    expect(onFailure).not.toHaveBeenCalled()
  })

  it('calls onFailure when transaction status is failed', async () => {
    ;(useSendAccount as unknown as jest.Mock).mockReturnValue({ data: { user_id: 'user123' } })
    ;(fetchOnrampTransactionStatus as jest.Mock).mockResolvedValue({
      transactions: [{ status: 'ONRAMP_TRANSACTION_STATUS_FAILED' }],
    })
    const onFailure = jest.fn()
    const onSuccess = jest.fn()
    render(<CoinbaseOnrampVerifyScreen onFailure={onFailure} onSuccess={onSuccess} />)
    await act(async () => {
      jest.advanceTimersByTime(100)
      await Promise.resolve()
    })
    expect(onFailure).toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('calls onFailure after max timeout if no valid transactions', async () => {
    ;(useSendAccount as unknown as jest.Mock).mockReturnValue({ data: { user_id: 'user123' } })
    ;(fetchOnrampTransactionStatus as jest.Mock).mockResolvedValue({
      transactions: null,
    })
    const onFailure = jest.fn()
    const onSuccess = jest.fn()
    render(<CoinbaseOnrampVerifyScreen onFailure={onFailure} onSuccess={onSuccess} />)

    await act(async () => {
      jest.advanceTimersByTime(MAX_TIMEOUT_MS)
      await Promise.resolve()
    })
    expect(onFailure).toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('calls onFailure if fetchOnrampTransactionStatus throws an error', async () => {
    ;(useSendAccount as unknown as jest.Mock).mockReturnValue({ data: { user_id: 'user123' } })
    ;(fetchOnrampTransactionStatus as jest.Mock).mockRejectedValue(new Error('error'))
    const onFailure = jest.fn()
    const onSuccess = jest.fn()
    render(
      <Provider>
        <CoinbaseOnrampVerifyScreen onFailure={onFailure} onSuccess={onSuccess} />
      </Provider>
    )

    await act(async () => {
      jest.advanceTimersByTime(100)
      await Promise.resolve()
    })
    expect(onFailure).toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
