// packages/app/features/deposit/coinbase/screen.test.tsx
import '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { DepositCoinbaseScreen } from './screen'
import { useSendAccount } from 'app/utils/send-accounts'
import { useCoinbaseOnramp } from 'app/utils/useCoinbaseOnramp'
import { OnrampFlow } from 'app/features/deposit/components/OnrampFlow'
import { Provider } from 'app/__mocks__/app/provider'
// Mock dependencies
jest.mock('app/utils/send-accounts', () => ({
  useSendAccount: jest.fn(),
}))
jest.mock('app/utils/useCoinbaseOnramp', () => ({
  useCoinbaseOnramp: jest.fn(),
}))
jest.mock('solito/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))
jest.mock('app/features/deposit/components/OnrampFlow', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Button } = require('@my/ui')
  return {
    __esModule: true,
    OnrampFlow: ({ onConfirmTransaction }) => (
      <Button testID="onramp-button" onPress={() => onConfirmTransaction(100)}>
        Confirm
      </Button>
    ),
  }
})

jest.mock('app/features/deposit/components/CoinbaseOnrampVerifyScreen', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Container } = require('@my/ui')
  return {
    __esModule: true,
    CoinbaseOnrampVerifyScreen: () => (
      <Container testID="pending-screen">CoinbaseOnrampVerifyScreen Mock</Container>
    ),
  }
})

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
  })

  // Test cases
  test('renders OnrampFlow in idle state', () => {
    render(
      <Provider>
        <DepositCoinbaseScreen />
      </Provider>
    )
    expect(screen.getByTestId('onramp-button')).toBeTruthy()
  })

  test('calls openOnramp when user submits', () => {
    render(
      <Provider>
        <DepositCoinbaseScreen />
      </Provider>
    )
    fireEvent.press(screen.getByTestId('onramp-button'))
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

    render(
      <Provider>
        <DepositCoinbaseScreen />
      </Provider>
    )
    expect(screen.getByText('Processing Transaction')).toBeTruthy()
    expect(screen.getByText('Complete in Coinbase window')).toBeTruthy()
  })

  test('renders PendingScreen when status is payment_submitted', () => {
    ;(useCoinbaseOnramp as jest.Mock).mockReturnValue({
      openOnramp: mockOpenOnramp,
      closeOnramp: mockCloseOnramp,
      status: 'payment_submitted',
      error: null,
      isLoading: false,
    })

    render(
      <Provider>
        <DepositCoinbaseScreen />
      </Provider>
    )
    expect(screen.getByTestId('pending-screen')).toBeTruthy()
  })

  test('renders success state when status is success', () => {
    ;(useCoinbaseOnramp as jest.Mock).mockReturnValue({
      openOnramp: mockOpenOnramp,
      closeOnramp: mockCloseOnramp,
      status: 'success',
      error: null,
      isLoading: false,
    })

    render(
      <Provider>
        <DepositCoinbaseScreen />
      </Provider>
    )
    expect(screen.getByTestId('success')).toBeTruthy()
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

    render(
      <Provider>
        <DepositCoinbaseScreen />
      </Provider>
    )
    expect(screen.getByTestId('error')).toBeTruthy()
  })

  test('renders failed state when coinbase status is failed', () => {
    ;(useCoinbaseOnramp as jest.Mock).mockReturnValue({
      openOnramp: mockOpenOnramp,
      closeOnramp: mockCloseOnramp,
      status: 'failed',
      error: null,
      isLoading: false,
    })

    render(
      <Provider>
        <DepositCoinbaseScreen />
      </Provider>
    )
    expect(screen.getByTestId('coinbase-failure')).toBeTruthy()
  })

  test('calls closeOnramp when Try Again button is clicked in error state', () => {
    ;(useCoinbaseOnramp as jest.Mock).mockReturnValue({
      openOnramp: mockOpenOnramp,
      closeOnramp: mockCloseOnramp,
      status: 'idle',
      error: new Error('Test error'),
      isLoading: false,
    })

    render(
      <Provider>
        <DepositCoinbaseScreen />
      </Provider>
    )
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

    render(
      <Provider>
        <DepositCoinbaseScreen />
      </Provider>
    )
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

    render(
      <Provider>
        <DepositCoinbaseScreen />
      </Provider>
    )
    fireEvent.press(screen.getByText('Try Again'))
    expect(mockCloseOnramp).toHaveBeenCalled()
  })

  test('passes defaultPaymentMethod to useCoinbaseOnramp', () => {
    render(
      <Provider>
        <DepositCoinbaseScreen defaultPaymentMethod="APPLE_PAY" />
      </Provider>
    )
    expect(useCoinbaseOnramp).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPaymentMethod: 'APPLE_PAY',
      })
    )
  })
})
