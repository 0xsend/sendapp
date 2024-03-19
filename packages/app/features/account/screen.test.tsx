import { Wrapper } from 'app/utils/__mocks__/Wrapper'
import { AccountScreen } from './screen'
import { render } from '@testing-library/react-native'

jest.mock('app/utils/useUser')

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
