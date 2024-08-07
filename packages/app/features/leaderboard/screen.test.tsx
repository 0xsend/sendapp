import { expect } from '@jest/globals'
import { Provider } from 'app/__mocks__/app/provider'
import { act, render, screen } from '@testing-library/react-native'
import { LeaderboardScreen } from './screen'

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

    const title = await screen.findByTestId('mainTitle')
    expect(title).toHaveTextContent('Best in Class')
    expect(screen.toJSON()).toMatchSnapshot('LeaderboardScreen')
  })
})
