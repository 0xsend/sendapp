import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'app/__mocks__/app/provider'
import { TamaguiProvider, config } from '@my/ui'
import { useRouter } from 'app/__mocks__/expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SwapScreen from './screen'

jest.mock('app/utils/useCoinFromTokenParam', () => ({
  useCoinFromTokenParam: jest.fn().mockReturnValue({
    coin: {
      label: 'USDC',
      symbol: 'USDC',
      token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      balance: 1_000_000n,
      decimals: 6,
      coingeckoTokenId: 'usd-coin',
    },
    isLoading: false,
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
        id: 'usd-coin',
        symbol: 'usdc',
        name: 'USDC',
        image: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694',
        current_price: 1.5,
        market_cap: 52512229982,
        price_change_percentage_24h: 2.5,
      },
    ],
    isLoading: false,
  }),

  useTokenPrice: jest.fn().mockImplementation((tokenId) => {
    const prices = {
      'usd-coin': { usd: 1.5 },
    }
    return { data: prices[tokenId] || { usd: 0 }, isLoading: false }
  }),
}))

jest.mock('app/utils/useTokenPrices', () => ({
  useTokenPrices: jest.fn().mockReturnValue({
    data: {
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 1.5,
    },
    isLoading: false,
  }),
}))

jest.mock('app/utils/swap-token', () => ({
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

  it('should render the swap screen with default values', async () => {
    renderWithProviders()

    expect(screen.getByText('Swap')).toBeTruthy()
    expect(screen.getByText('You Pay')).toBeTruthy()
    expect(screen.getByText('You Receive')).toBeTruthy()

    const fromDropdownButton = screen.getByTestId('fromdropdown-button')
    const toDropdownButton = screen.getByTestId('todropdown-button')

    await waitFor(() => expect(fromDropdownButton).toHaveTextContent('USDC'))
    await waitFor(() => expect(toDropdownButton).toHaveTextContent('SEND'))
  })

  it('should allow input of send amount and display calculated receive amount', async () => {
    const outputAmount = '72232173016371'
    jest.mock('app/utils/swap-token', () => ({
      useSwapToken: jest.fn().mockImplementation(() => ({
        data: { outputAmount },
        isLoading: false,
      })),
    }))

    renderWithProviders()

    const sendInput = screen.getByTestId('send-amount-input')
    await userEvent.type(sendInput, '1')

    expect(sendInput).toHaveDisplayValue('1')

    await act(async () => {
      jest.runOnlyPendingTimers()
      jest.advanceTimersByTime(500)
      jest.runAllTimers()
    })

    await waitFor(() => {
      const receiveInput = screen.getByTestId('receive-amount-output')

      const outputAmountInWei = BigInt(outputAmount)
      const toTokenDecimals = 18

      const expectedReceiveAmount = (Number(outputAmountInWei) / 10 ** toTokenDecimals).toFixed(6)
      expect(receiveInput).toHaveDisplayValue(expectedReceiveAmount)
    })
  }, 10000)

  it('should swap tokens when swap button is clicked', async () => {
    renderWithProviders()

    expect(screen.getByTestId('fromdropdown-button')).toHaveTextContent('USDC')

    const swapButton = screen.getByTestId('swap-button')
    await userEvent.press(swapButton)

    await waitFor(() => {
      expect(screen.getByTestId('todropdown-button')).toHaveTextContent('SEND')
    })
  })
})
