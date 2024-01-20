import { expect, test } from '@jest/globals'
import { TamaguiProvider, config } from '@my/ui'
import { render } from '@testing-library/react-native'
import { ReferralsScreen } from './screen'

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
jest.mock('app/utils/UseUserReferralsCount', () => ({
  useUserReferralsCount: jest.fn().mockReturnValue({ referralsCount: 123, error: null }),
}))

jest.mock('app/utils/useDistributionBonusPoolShares', () => ({
  useDistributionBonusPoolShares: jest
    .fn()
    .mockReturnValue([{ bonus_pool_amount: [123] }, { bonus_pool_amount: [456] }]),
}))

jest.mock('app/utils/NameDisplayUtils', () => ({
  shorten: jest.fn(),
}))

test('ReferralScreen', () => {
  const tree = render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <ReferralsScreen />
    </TamaguiProvider>
  ).toJSON()
  expect(tree).toMatchSnapshot()
})
