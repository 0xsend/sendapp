// packages/app/features/deposit/coinbase/screen.test.tsx
import '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { DepositCoinbaseScreen } from './screen'
import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinbaseOnramp } from 'app/utils/useCoinbaseOnramp'
import { OnrampFlow } from 'app/features/deposit/components/OnrampFlow'

// Mock dependencies
jest.mock('app/utils/send-accounts')
jest.mock('app/utils/useCoinbaseOnramp')
jest.mock('app/features/deposit/components/OnrampFlow')

describe('DepositCoinbaseScreen', () => {
  // Setup mocks
  const mockSendAccount = {
    data: {
      address: '0x123',
      user_id: 'user123',
    },
  }

  const mockOpenOnramp = jest.fn()
  const mockCloseOnramp = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    ;(useSendAccount as unknown as jest.Mock).mockReturnValue(mockSendAccount)
    ;(useCoinbaseOnramp as jest.Mock).mockReturnValue({
      openOnramp: mockOpenOnramp,
      closeOnramp: mockCloseOnramp,
      status: 'idle',
      error: null,
      isLoading: false,
    })

    // Mock OnrampFlow to capture the onConfirmTransaction callback
    ;(OnrampFlow as jest.Mock).mockImplementation(({ onConfirmTransaction }) => (
      <button type="button" data-testid="confirm-button" onClick={() => onConfirmTransaction(100)}>
        Confirm
      </button>
    ))
  })

  // Test cases
  test('renders OnrampFlow in initial state', () => {
    render(<DepositCoinbaseScreen />)
    expect(OnrampFlow).toHaveBeenCalled()
  })

  test('calls openOnramp with correct amount when transaction is confirmed', () => {
    render(<DepositCoinbaseScreen />)
    fireEvent.press(screen.getByTestId('confirm-button'))
    expect(mockOpenOnramp).toHaveBeenCalledWith(100)
  })

  test('renders loading state when status is pending_payment', () => {
    ;(useCoinbaseOnramp as jest.Mock).mockReturnValue({
      openOnramp: mockOpenOnramp,
      closeOnramp: mockCloseOnramp,
      status: 'pending_payment',
      error: null,
      isLoading: true,
    })

    render(<DepositCoinbaseScreen />)
    expect(screen.getByText('Processing Transaction')).toBeTruthy()
    expect(screen.getByText('Complete in Coinbase window')).toBeTruthy()
  })

  test('renders PendingScreen when status is payment_submitted', () => {
    ;(useCoinbaseOnramp as jest.Mock).mockReturnValue({
      openOnramp: mockOpenOnramp,
      closeOnramp: mockCloseOnramp,
      status: 'payment_submitted',
      error: null,
      isLoading: true,
    })

    render(<DepositCoinbaseScreen />)
    expect(screen.getByTestId('pending-screen')).toBeTruthy()
  })

  test('renders success state when status is success', () => {
    ;(useCoinbaseOnramp as jest.Mock).mockReturnValue({
      openOnramp: mockOpenOnramp,
      closeOnramp: mockCloseOnramp,
      status: 'success',
      error: null,
      isLoading: true,
    })

    render(<DepositCoinbaseScreen />)
    expect(screen.getByText('Transaction Complete')).toBeTruthy()
    expect(screen.getByText('Finishing up...')).toBeTruthy()
    expect(screen.getByTestId('spinner')).toBeTruthy()
  })

  test('renders error state when there is an error', () => {
    const testError = new Error('Test error message')
    ;(useCoinbaseOnramp as jest.Mock).mockReturnValue({
      openOnramp: mockOpenOnramp,
      closeOnramp: mockCloseOnramp,
      status: 'idle',
      error: testError,
      isLoading: false,
    })

    render(<DepositCoinbaseScreen />)
    expect(screen.getByText('Unable to Initialize Payment')).toBeTruthy()
    expect(screen.getByText('Test error message')).toBeTruthy()
  })

  test('renders failed state when status is failed', () => {
    ;(useCoinbaseOnramp as jest.Mock).mockReturnValue({
      openOnramp: mockOpenOnramp,
      closeOnramp: mockCloseOnramp,
      status: 'failed',
      error: null,
      isLoading: false,
    })

    render(<DepositCoinbaseScreen />)
    expect(screen.getByText('Transaction Failed')).toBeTruthy()
    expect(screen.getByText('Your payment could not be processed. Please try again.')).toBeTruthy()
  })

  test('calls closeOnramp when Try Again button is clicked in error state', () => {
    ;(useCoinbaseOnramp as jest.Mock).mockReturnValue({
      openOnramp: mockOpenOnramp,
      closeOnramp: mockCloseOnramp,
      status: 'idle',
      error: new Error('Test error'),
      isLoading: false,
    })

    render(<DepositCoinbaseScreen />)
    fireEvent.press(screen.getByText('Try Again'))
    expect(mockCloseOnramp).toHaveBeenCalled()
  })

  test('calls closeOnramp when Cancel button is clicked in pending_payment state', () => {
    ;(useCoinbaseOnramp as jest.Mock).mockReturnValue({
      openOnramp: mockOpenOnramp,
      closeOnramp: mockCloseOnramp,
      status: 'pending_payment',
      error: null,
      isLoading: true,
    })

    render(<DepositCoinbaseScreen />)
    fireEvent.press(screen.getByText('Cancel'))
    expect(mockCloseOnramp).toHaveBeenCalled()
  })

  test('calls closeOnramp when Try Again button is clicked in failed state', () => {
    ;(useCoinbaseOnramp as jest.Mock).mockReturnValue({
      openOnramp: mockOpenOnramp,
      closeOnramp: mockCloseOnramp,
      status: 'failed',
      error: null,
      isLoading: false,
    })

    render(<DepositCoinbaseScreen />)
    fireEvent.press(screen.getByText('Try Again'))
    expect(mockCloseOnramp).toHaveBeenCalled()
  })

  test('passes defaultPaymentMethod to useCoinbaseOnramp', () => {
    render(<DepositCoinbaseScreen defaultPaymentMethod="APPLE_PAY" />)
    expect(useCoinbaseOnramp).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPaymentMethod: 'APPLE_PAY',
      })
    )
  })

  test('passes correct parameters to useCoinbaseOnramp', () => {
    render(<DepositCoinbaseScreen />)
    expect(useCoinbaseOnramp).toHaveBeenCalledWith({
      projectId: expect.any(String),
      address: mockSendAccount.data.address,
      partnerUserId: mockSendAccount.data.user_id,
      defaultPaymentMethod: 'CARD',
    })
  })

  test('handles case when sendAccount is null', () => {
    ;(useSendAccount as unknown as jest.Mock).mockReturnValue({
      data: null,
    })

    render(<DepositCoinbaseScreen />)
    expect(useCoinbaseOnramp).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '',
        partnerUserId: '',
      })
    )
  })

  test('passes isLoading to OnrampFlow', () => {
    ;(useCoinbaseOnramp as jest.Mock).mockReturnValue({
      openOnramp: mockOpenOnramp,
      closeOnramp: mockCloseOnramp,
      status: 'idle',
      error: null,
      isLoading: true,
    })

    render(<DepositCoinbaseScreen />)
    expect(OnrampFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        isLoading: true,
      }),
      expect.anything()
    )
  })
})
