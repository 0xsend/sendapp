import { expect, test } from '@jest/globals'
import { TamaguiProvider, config } from '@my/ui'
import { render } from '@testing-library/react-native'
import { HomeScreen } from './screen'

jest.mock('app/utils/useUser', () => ({
  useUser: jest.fn().mockReturnValue({
    user: {
      id: '123',
      profile: { referral_code: '123' },
    },
  }),
}))

jest.mock('app/routers/params', () => ({
  useNav: jest.fn().mockReturnValue([undefined, jest.fn()]),
}))

jest.mock('wagmi', () => ({
  createConfig: jest.fn(),
  useChainId: jest.fn().mockReturnValue(1337),
  useBalance: jest.fn().mockReturnValue({
    data: {
      decimals: 6,
      formatted: '0',
      symbol: 'send',
      value: 0n,
    },
    isPending: true,
    refetch: jest.fn(),
  }),
  useAccount: jest.fn().mockReturnValue({
    address: '0x123',
    isConnected: false,
  }),
  useConnect: jest.fn().mockReturnValue({
    connectAsync: jest.fn(),
  }),
  useDisconnect: jest.fn().mockReturnValue({
    disconnect: jest.fn(),
  }),
}))

jest.mock('solito/link', () => ({
  Link: jest.fn(),
}))

jest.mock('app/utils/useUserReferralsCount', () => ({
  useUserReferralsCount: jest.fn().mockReturnValue(123),
}))

jest.mock('app/utils/useSendAccountBalances', () => ({
  useSendAccountBalances: jest.fn().mockReturnValue({
    balances: {
      '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A': {},
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': {},
    },
    totalBalance: () => 0,
  }),
}))

jest.mock('app/utils/send-accounts', () => ({
  useSendAccount: jest.fn().mockReturnValue({
    account: {
      address: '0x123',
      init_code: '0x123',
    },
  }),
}))

jest.mock('@tamagui/tooltip', () => ({
  ...jest.requireActual('@tamagui/tooltip'),
  TooltipGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('solito', () => ({
  createParam: jest
    .fn()
    .mockReturnValue({ useParam: jest.fn().mockReturnValue([undefined, jest.fn()]) }),
}))

jest.mock('app/routers/params', () => ({
  useRootScreenParams: jest.fn().mockReturnValue([{ nav: 'home', token: undefined }, jest.fn()]),
}))

jest.mock('app/features/home/utils/useTokenActivityFeed')

test('HomeScreen', () => {
  const tree = render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <HomeScreen />
    </TamaguiProvider>
  ).toJSON()
  expect(tree).toMatchSnapshot()
})
