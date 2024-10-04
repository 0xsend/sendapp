import { Wrapper } from 'app/utils/__mocks__/Wrapper'
import { ActivityRewardsScreen } from './screen'
import { act, render, screen } from '@testing-library/react-native'

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
    expect(screen.toJSON()).toMatchSnapshot('ActivityRewardsScreen')
  })
})
