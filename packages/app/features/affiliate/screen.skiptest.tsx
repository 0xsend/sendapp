import { expect, test, jest } from '@jest/globals'
import { TamaguiProvider, config } from '@my/ui'
import { render, act, screen } from '@testing-library/react-native'
import { AffiliateScreen } from './screen'

jest.mock('app/features/affiliate/utils/useAffiliateReferrals', () => ({
  useAffiliateReferrals: jest.fn().mockReturnValue({ data: [], error: null }),
}))
jest.mock('app/features/affiliate/utils/useAffiliateStats', () => ({
  useAffiliateStats: jest.fn().mockReturnValue({ data: null, error: null }),
}))

test('AffiliateScreen', async () => {
  jest.useFakeTimers()
  render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <AffiliateScreen />
    </TamaguiProvider>
  )
  await act(async () => {
    jest.advanceTimersByTime(2000)
    jest.runAllTimers()
  })
  expect(screen.toJSON()).toMatchSnapshot()
})
