import { describe, expect, it } from '@jest/globals'
import { config, TamaguiProvider } from '@my/ui'
import { render, screen } from '@testing-library/react-native'
import { SendScreen } from './screen'
import { useProfileLookup } from 'app/utils/useProfileLookup'

jest.mock('app/utils/api', () => ({
  transfer: {
    withUserOp: jest.fn().mockReturnValue({
      useMutation: jest.fn().mockReturnValue({
        mutateAsync: jest.fn().mockReturnValue(Promise.resolve('123')),
      }),
    }),
  },
}))

jest.mock('app/provider/coins', () => ({
  useCoins: jest.fn().mockReturnValue({
    coins: [
      {
        label: 'USDC',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        balance: 250000n,
      },
      {
        label: 'SEND',
        token: '0xEab49138BA2Ea6dd776220fE26b7b8E446638956',
        balance: 250000n,
      },
    ],
    totalPrice: 5000000n,
  }),
}))

jest.mock('solito/router', () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
}))

jest.mock('app/provider/tag-search', () => ({
  useTagSearch: jest.fn().mockReturnValue({
    results: [],
    isLoading: false,
    error: null,
  }),
  TagSearchProvider: jest.fn().mockImplementation(({ children }) => children),
}))

jest.mock('app/components/SearchBar', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { View } = require('react-native')
  const MockedSearch = () => <View testID="mocked-search" />
  // eslint-disable-next-line react/display-name
  MockedSearch.Results = () => <View testID="mocked-search-results" />
  return {
    __esModule: true,
    default: MockedSearch,
  }
})

jest.mock('app/utils/useProfileLookup', () => ({
  useProfileLookup: jest.fn().mockReturnValue({
    data: {
      address: '0x123',
      send_id: 3665,
      tag_name: 'test',
      avatar_url: 'https://avatars.githubusercontent.com/u/123',
    },
    isLoading: false,
    error: null,
  }),
}))

jest.mock('app/routers/params', () => ({
  useSendScreenParams: jest
    .fn()
    .mockReturnValue([
      { idType: 'tag', amount: '1000000', sendToken: 'test', note: 'test' },
      jest.fn(),
    ]),
  useRootScreenParams: jest.fn().mockReturnValue([{}, jest.fn()]),
}))

jest.mock('app/utils/useCoinFromTokenParam', () => ({
  useCoinFromSendTokenParam: jest.fn().mockReturnValue({
    coin: {
      label: 'USDC',
      token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      balance: 250000n,
    },
  }),
}))

jest.mock('app/provider/theme', () => ({
  useThemeSetting: jest.fn().mockReturnValue({ resolvedTheme: 'dark' }),
}))

const mockUseProfileLookup = useProfileLookup as jest.Mock

describe('SendScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render send form when profile is found', () => {
    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <SendScreen />
      </TamaguiProvider>
    )

    const avatar = screen.getByTestId('avatarImage')
    expect(avatar).toBeOnTheScreen()
    expect(avatar.props.source.uri).toBe('https://avatars.githubusercontent.com/u/123')
    expect(screen.getByTestId('MockSolitoLink')).toBeOnTheScreen()
    expect(screen.getByTestId('SelectCoinTrigger')).toBeOnTheScreen()
    expect(screen.getByTestId('SendFormBalance')).toBeOnTheScreen()
    expect(screen.getByPlaceholderText('Add a note')).toBeOnTheScreen()
    expect(screen.getByText('CONTINUE')).toBeOnTheScreen()
    expect(screen).toMatchSnapshot()
  })

  it('should render search when no profile was returned profile lookup returned', () => {
    mockUseProfileLookup.mockReturnValueOnce({ data: null, isLoading: false, error: null })

    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <SendScreen />
      </TamaguiProvider>
    )

    expect(screen.getByTestId('mocked-search')).toBeOnTheScreen()
    expect(screen.getByTestId('mocked-search-results')).toBeOnTheScreen()
  })

  it('should render no send account when returned profile has no address', () => {
    mockUseProfileLookup.mockReturnValueOnce({ data: {}, isLoading: false, error: null })

    render(
      <TamaguiProvider defaultTheme={'dark'} config={config}>
        <SendScreen />
      </TamaguiProvider>
    )

    expect(screen.getByTestId('NoSendAccount')).toBeOnTheScreen()
    expect(screen.getByText('No send account')).toBeOnTheScreen()
  })
})
