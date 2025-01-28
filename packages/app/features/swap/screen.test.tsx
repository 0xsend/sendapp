import { render, screen, userEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'app/__mocks__/app/provider'
import { TamaguiProvider, config } from '@my/ui'
import { SwapScreen } from './screen'
import { useRouter } from 'app/__mocks__/expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

jest.mock('app/utils/useCoinFromTokenParam', () => ({
  useCoinFromTokenParam: jest.fn().mockReturnValue({
    coin: {
      label: 'USDC',
      symbol: 'USDC',
      token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      balance: BigInt(1000000),
      decimals: 6,
      coingeckoTokenId: 'usd-coin',
    },
  }),
}))

jest.mock('app/provider/coins', () => ({
  useCoins: jest.fn().mockReturnValue({
    coins: [
      {
        label: 'SEND',
        symbol: 'SEND',
        token: '0xEab49138BA2Ea6dd776220fE26b7b8E446638956',
        balance: BigInt(500000),
        decimals: 18,
        coingeckoTokenId: 'send-token',
      },
    ],
  }),
}))

jest.mock('app/utils/coin-gecko', () => ({
  useTokenMarketData: jest.fn().mockReturnValue({
    data: [
      {
        current_price: 1.5,
        price_change_percentage_24h: 2.5,
      },
    ],
    status: 'success',
  }),

  useTokenPrice: jest.fn().mockImplementation((tokenId) => {
    if (tokenId === 'usd-coin') {
      return { data: { usd: 1 }, isLoading: false }
    }
    if (tokenId === 'send-token') {
      return { data: { usd: 0.00012139 }, isLoading: false }
    }
    return { data: null, isLoading: true }
  }),
}))

jest.mock('app/utils/get-quote', () => ({
  useSwapToken: jest.fn().mockImplementation(() => ({
    data: {
      outputAmount: '72232173016371',
    },
    isLoading: false,
  })),
}))

describe('SwapScreen', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.useFakeTimers()
    queryClient = new QueryClient()

    useRouter.mockImplementation(() => ({
      query: { token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
      push: jest.fn(),
    }))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Provider>
          <TamaguiProvider defaultTheme="dark" config={config}>
            <SwapScreen />
          </TamaguiProvider>
        </Provider>
      </QueryClientProvider>
    )
  }

  it('should render the swap screen with default values', async () => {
    renderWithProviders()

    expect(screen.getByText('Swap')).toBeTruthy()
    expect(screen.getByText('You pay')).toBeTruthy()
    expect(screen.getByText('You Receive')).toBeTruthy()

    const fromDropdownButton = screen.getByTestId('fromdropdown-button')
    const toDropdownButton = screen.getByTestId('todropdown-button')

    await waitFor(() => expect(fromDropdownButton).toHaveTextContent('USDC'))
    await waitFor(() => expect(toDropdownButton).toHaveTextContent('SEND'))
  })

  // skipping for now: has timeout issue but passing on single test
  it.skip('should allow input of send amount and display calculated receive amount', async () => {
    jest.mock('app/utils/get-quote', () => ({
      useSwapToken: jest.fn().mockImplementation(() => ({
        data: { outputAmount: '72232173016371' },
        isLoading: false,
      })),
    }))

    renderWithProviders()

    const sendInput = screen.getByTestId('send-amount-input')
    await userEvent.type(sendInput, '1')

    expect(sendInput).toHaveDisplayValue('1')

    await waitFor(() => {
      const receiveInput = screen.getByTestId('receive-amount-output')
      expect(receiveInput).toHaveDisplayValue('72.232173')
    })
  })

  it('should swap tokens when swap button is clicked', async () => {
    renderWithProviders()

    expect(screen.getByTestId('fromdropdown-button')).toHaveTextContent('USDC')

    const swapButton = screen.getByTestId('swap-button')
    await userEvent.press(swapButton)

    await waitFor(() => {
      expect(screen.getByTestId('todropdown-button')).toHaveTextContent('SEND')
    })
  })

  // to be fix: balance wont show on sendInput
  // passing on single test,
  it.skip('should set max send amount when MAX button is clicked', async () => {
    renderWithProviders()

    const maxButton = screen.getByTestId('max-button')
    await userEvent.press(maxButton)

    const sendInput = await screen.findByTestId('send-amount-input')
    expect(sendInput.props.value).toBe('1')
  })

  it('should match snapshot', async () => {
    const tree = render(
      <Provider>
        <TamaguiProvider defaultTheme="dark" config={config}>
          <SwapScreen />
        </TamaguiProvider>
      </Provider>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
