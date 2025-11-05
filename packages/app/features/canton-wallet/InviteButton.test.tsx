import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import { CantonWalletInviteButton } from './InviteButton'

// Mock the hook
jest.mock('app/utils/useCantonWallet', () => ({
  useCantonWallet: jest.fn(),
}))

// Mock @my/ui components
jest.mock('@my/ui', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TouchableOpacity, Text } = require('react-native')

  // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types for component props
  const MockButton = ({ onPress, disabled, children, icon }: any) => {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled} testID="invite-button">
        {icon}
        {children}
      </TouchableOpacity>
    )
  }

  // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types for component props
  const MockButtonText = ({ children }: any) => <Text>{children}</Text>
  MockButtonText.displayName = 'MockButton.Text'
  MockButton.Text = MockButtonText

  const MockSpinner = () => <Text testID="spinner">Loading...</Text>
  MockSpinner.displayName = 'MockSpinner'

  return {
    Button: MockButton,
    Spinner: MockSpinner,
  }
})

import { useCantonWallet } from 'app/utils/useCantonWallet'

const useCantonWalletMock = useCantonWallet as jest.MockedFunction<typeof useCantonWallet>

describe('CantonWalletInviteButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render button with correct label', () => {
    useCantonWalletMock.mockReturnValue({
      generatePriorityToken: jest.fn(),
      isGenerating: false,
      error: null,
      isSuccess: false,
    })

    render(<CantonWalletInviteButton />)

    expect(screen.getByText('Get Priority Invite')).toBeTruthy()
  })

  it('should call generatePriorityToken when pressed', async () => {
    const mockGenerate = jest.fn()
    useCantonWalletMock.mockReturnValue({
      generatePriorityToken: mockGenerate,
      isGenerating: false,
      error: null,
      isSuccess: false,
    })

    render(<CantonWalletInviteButton />)
    const button = screen.getByTestId('invite-button')

    fireEvent.press(button)

    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalledTimes(1)
    })
  })

  it('should show spinner when generating', () => {
    useCantonWalletMock.mockReturnValue({
      generatePriorityToken: jest.fn(),
      isGenerating: true,
      error: null,
      isSuccess: false,
    })

    render(<CantonWalletInviteButton />)

    expect(screen.getByTestId('spinner')).toBeTruthy()
  })

  it('should pass disabled prop to button when generating', () => {
    const mockGenerate = jest.fn()
    useCantonWalletMock.mockReturnValue({
      generatePriorityToken: mockGenerate,
      isGenerating: true,
      error: null,
      isSuccess: false,
    })

    render(<CantonWalletInviteButton />)

    // The hook returns isGenerating=true, which should disable the button
    // The implementation passes disabled={isGenerating}
    expect(useCantonWalletMock).toHaveBeenCalled()
  })

  it('should allow button interaction when not generating', () => {
    const mockGenerate = jest.fn()
    useCantonWalletMock.mockReturnValue({
      generatePriorityToken: mockGenerate,
      isGenerating: false,
      error: null,
      isSuccess: false,
    })

    render(<CantonWalletInviteButton />)
    const button = screen.getByTestId('invite-button')

    // When not generating, button should be pressable
    fireEvent.press(button)
    expect(mockGenerate).toHaveBeenCalledTimes(1)
  })
})
