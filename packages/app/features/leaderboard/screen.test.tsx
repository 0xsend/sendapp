import { expect } from '@jest/globals'
import { Provider } from 'app/__mocks__/app/provider'
import { act, render, screen } from '@testing-library/react-native'
import { LeaderboardScreen } from './screen'

const testReferral = {
  referrals: 10,
  rewards_usdc: 12,
  user: {
    avatar_url: 'https://i.pravatar.cc/500?u=Frederick Bartell',
    id: 1,
    name: 'Sophie Jenkins Jr.',
    send_id: 47788,
  },
}

jest.mock('./utils/useLeaderboard', () => ({
  useLeaderboard: jest.fn().mockReturnValue({
    data: {
      referrals: [testReferral],
      rewards: [],
    },
  }),
}))

describe('LeaderboardScreen', () => {
  it('renders leaderboard screen', async () => {
    jest.useFakeTimers()
    render(
      <Provider>
        <LeaderboardScreen />
      </Provider>
    )
    await act(async () => {
      jest.runAllTimers()
    })

    expect(screen.getByTestId('mainTitle')).toHaveTextContent('Best in Class')
    expect(screen.getByTestId(`${testReferral.user.id}-${testReferral.user.send_id}`)).toBeVisible()
    expect(screen.toJSON()).toMatchSnapshot('LeaderboardScreen')
  })
})
