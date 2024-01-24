import { expect, test } from '@jest/globals'
import { TamaguiProvider, config } from '@my/ui'
import { render } from '@testing-library/react-native'
import { ReferralsScreen } from './screen'

jest.mock('app/utils/UseUserReferralsCount', () => ({
  useUserReferralsCount: jest.fn().mockReturnValue({ referralsCount: 123, error: null }),
}))

test('ReferralScreen', () => {
  const tree = render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <ReferralsScreen />
    </TamaguiProvider>
  ).toJSON()
  expect(tree).toMatchSnapshot()
})
