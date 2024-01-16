import { expect, test } from '@jest/globals'
import { TamaguiProvider, config } from '@my/ui'
import { render } from '@testing-library/react-native'
import { AccountScreen } from './screen'

jest.mock('app/utils/useUser', () => ({
  useUser: jest.fn().mockReturnValue({
    user: {
      id: '123',
      profile: { referral_code: '123' },
    },
  }),
}))

jest.mock('wagmi', () => ({
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

jest.mock('app/utils/UseUserReferralsCount', () => ({
  useUserReferralsCount: jest.fn().mockReturnValue(123),
}))

test('AccountScreen', () => {
  const tree = render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <AccountScreen />
    </TamaguiProvider>
  ).toJSON()
  expect(tree).toMatchSnapshot()
})
