import '@jest/globals'
import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'app/__mocks__/app/provider'
import * as wagmi from 'wagmi'
import * as myWagmi from '@my/wagmi'
import { DepositWeb3Screen } from './screen'
import * as web3modal from '@web3modal/wagmi/react'

jest.mock('wagmi')
jest.mock('@my/wagmi')
jest.mock('@web3modal/wagmi/react')

const { useAccount, useSendTransaction, useBalance, useSwitchAccount } =
  wagmi as unknown as typeof import('app/__mocks__/wagmi')
const { useWriteErc20Transfer } = myWagmi as unknown as typeof import('app/__mocks__/@my/wagmi')
const { useWeb3Modal } =
  web3modal as unknown as typeof import('app/__mocks__/@web3modal/wagmi/react')

describe('DepositWeb3Screen', () => {
  afterEach(() => {
    useAccount.mockClear()
    useWriteErc20Transfer.mockClear()
    useSendTransaction.mockClear()
    useBalance.mockClear()
    useWeb3Modal.mockClear()
    useSwitchAccount.mockClear()
  })
  it('renders the deposit web3 form when wallet is connected', async () => {
    const mockAccount = {
      isConnected: true,
      address: '0x123',
      chainId: 845337,
      chain: {
        id: 845337,
        name: 'Ethereum',
        nativeCurrency: {
          decimals: 18,
          name: 'Ethereum',
          symbol: 'ETH',
        },
      },
    }
    useAccount.mockReturnValue(mockAccount)
    const mockSendTransaction = {
      sendTransactionAsync: jest.fn(),
      isLoading: false,
      isFetching: false,
      isFetched: true,
      isSubmitting: false,
      isSubmitted: false,
      error: null,
    }
    useSendTransaction.mockReturnValue(mockSendTransaction)
    const mockBalance = {
      data: {
        value: 123n,
      },
      isLoading: false,
      isSuccess: true,
      isFetching: false,
      isFetched: true,
      error: null,
      refetch: jest.fn(),
    }
    useBalance.mockImplementation((/*{address, token, query }*/) => {
      return mockBalance
    })
    const mockWriteErc20Transfer = {
      data: '0x123',
      writeContractAsync: jest.fn(),
      isPending: false,
      error: null,
    }
    useWriteErc20Transfer.mockReturnValue(mockWriteErc20Transfer)
    render(
      <Provider>
        <DepositWeb3Screen />
      </Provider>
    )
    await waitFor(() => expect(screen.getByText(`Depositing from ${'0x123'}`)).toBeVisible())
    expect(screen).toMatchSnapshot()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Amount'), '0.01')
    const depositButton = screen.getByRole('button', { name: 'Deposit' })
    await act(async () => {
      // await user.press(depositButton) // something about tamagui button is causing this to fail
      await depositButton.props.onPress()
    })
    expect(mockWriteErc20Transfer.writeContractAsync).toHaveBeenCalled()
  })
  it('renders the connect to deposit when wallet is not connected', async () => {
    useAccount.mockReturnValue({
      isConnected: false,
    })
    useWeb3Modal.mockReturnValue({
      open: jest.fn(),
    })

    render(
      <Provider>
        <DepositWeb3Screen />
      </Provider>
    )
    // screen.debug({ message: 'DepositWeb3Screen: render' })
    await waitFor(() =>
      expect(screen.getByRole('header', { name: 'Connect to Deposit' })).toBeVisible()
    )
    expect(screen).toMatchSnapshot()
    const user = userEvent.setup()
    await user.press(screen.getByRole('button', { name: 'Connect to Deposit' }))
    expect(useWeb3Modal).toHaveBeenCalled()
  })
  it('renders the switch network screen when base network is not selected', async () => {
    useAccount.mockReturnValue({
      isConnected: true,
      address: '0x123',
      chainId: 1337,
      chain: {
        id: 1337,
        name: 'Ethereum',
        nativeCurrency: {
          decimals: 18,
          name: 'Ethereum',
          symbol: 'ETH',
        },
      },
    })
    useWeb3Modal.mockReturnValue({
      open: jest.fn(),
    })
    render(
      <Provider>
        <DepositWeb3Screen />
      </Provider>
    )
    const switchNetworkButton = screen.getByRole('button', { name: 'Switch' })
    await waitFor(() => expect(switchNetworkButton).toBeVisible())
    expect(screen).toMatchSnapshot()
    const user = userEvent.setup()
    await user.press(switchNetworkButton)
    expect(useWeb3Modal).toHaveBeenCalled()
  })
})
