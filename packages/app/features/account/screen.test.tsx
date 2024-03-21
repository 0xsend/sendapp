import { Wrapper } from 'app/utils/__mocks__/Wrapper'
import { AccountScreen } from './screen'
import { render } from '@testing-library/react-native'

jest.mock('app/utils/useUser')
jest.mock('app/utils/getReferralLink', () => ({
  getReferralHref: jest.fn().mockReturnValue('https://send.it/123'),
}))
jest.mock('app/routers/params', () => ({
  useNav: jest.fn().mockReturnValue([undefined, jest.fn()]),
}))
describe('AccountScreen', () => {
  it('renders the account screen', () => {
    const tree = render(
      <Wrapper>
        <AccountScreen />
      </Wrapper>
    )

    expect(tree.toJSON()).toMatchSnapshot('AccountScreen')
  })
})
