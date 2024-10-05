import { expect, test } from '@jest/globals'
import { TamaguiProvider, config } from '@my/ui'
import { render, act, screen } from '@testing-library/react-native'
import { ReferralsScreen } from './screen'

jest.mock('app/utils/useUserReferralsCount', () => ({
  useUserReferralsCount: jest.fn().mockReturnValue({ data: 123, error: null }),
}))

test('ReferralScreen', async () => {
  jest.useFakeTimers()
  render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <ReferralsScreen />
    </TamaguiProvider>
  )
  await act(async () => {
    jest.advanceTimersByTime(2000)
    jest.runAllTimers()
  })
  expect(screen.toJSON()).toMatchSnapshot()
})
