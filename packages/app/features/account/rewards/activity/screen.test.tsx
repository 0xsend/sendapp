import { Wrapper } from 'app/utils/__mocks__/Wrapper'
import { ActivityRewardsScreen } from './screen'
import { act, render, screen } from '@testing-library/react-native'

jest.mock('app/utils/distributions', () => ({
  useMonthlyDistributions: () => ({
    data: [
      {
        number: 7,
        chain_id: 845337,
        qualification_end: Date.UTC(2024, 6, 15),
        distribution_shares: [
          {
            amount: 1,
            index: 1,
          },
        ],
        distribution_verifications_summary: [
          {
            tag_referrals: 123,
          },
        ],
      },
    ],
  }),
}))

jest.mock('app/routers/params', () => ({
  useRewardsScreenParams: () => [{ distributionNumber: 1 }, jest.fn()],
}))

describe('ActivityRewardsScreen', () => {
  it('renders', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(Date.UTC(2024, 6, 12))
    render(
      <Wrapper>
        <ActivityRewardsScreen />
      </Wrapper>
    )

    await act(async () => {
      jest.advanceTimersByTime(2000)
    })
    expect(screen.getByTestId('SelectDistributionDate')).toBeVisible()
    expect(screen.toJSON()).toMatchSnapshot('ActivityRewardsScreen')
  })
})
