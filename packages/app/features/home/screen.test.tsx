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

jest.mock('app/utils/getReferralLink', () => ({
  getReferralHref: jest.fn().mockReturnValue('https://send.it/123'),
}))

jest.mock('solito/link', () => ({
  Link: jest.fn(),
}))

jest.mock('app/utils/useUserReferralsCount', () => ({
  useUserReferralsCount: jest.fn().mockReturnValue(123),
}))

// jest.mock('@vonovak/react-native-theme-control', () => ({
//   useThemePreference: jest.fn().mockReturnValue('light'),
//   setThemePreference: jest.fn(),
// }))

test('HomeScreen', () => {
  const tree = render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <HomeScreen />
    </TamaguiProvider>
  ).toJSON()
  expect(tree).toMatchSnapshot()
})
