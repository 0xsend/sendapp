import { Wrapper } from 'app/utils/__mocks__/Wrapper'
import { AccountScreen } from './screen'
import { render, screen, act } from '@testing-library/react-native'

jest.mock('app/utils/useUser')
jest.mock('app/utils/tags', () => ({
  useConfirmedTags: jest.fn().mockReturnValue([{ name: 'test' }]),
}))
jest.mock('app/utils/getLink', () => ({
  getShareableLink: jest.fn().mockReturnValue('https://send.it/123'),
}))
jest.mock('app/routers/params', () => ({
  useNav: jest.fn().mockReturnValue([undefined, jest.fn()]),
}))
describe('AccountScreen', () => {
  it('renders the account screen', async () => {
    jest.useFakeTimers()
    render(
      <Wrapper>
        <AccountScreen />
      </Wrapper>
    )
    await act(async () => {
      jest.runAllTimers()
    })

    expect(screen.toJSON()).toMatchSnapshot('AccountScreen')
  })
})
