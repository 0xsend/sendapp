import '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react-native'
import { Provider } from 'app/__mocks__/app/provider'
import { DepositScreen } from './screen'

jest.mock('wagmi')

jest.mock('@my/ui', () => ({
  ...jest.requireActual('@my/ui'),
  Fade: ({ children }) => children,
}))

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}))

describe('DepositScreen', () => {
  it('renders the deposit screen', async () => {
    render(
      <Provider>
        <DepositScreen />
      </Provider>
    )

    await waitFor(() => expect(screen.getByText('Via Crypto')).toBeVisible())
    expect(screen).toMatchSnapshot()
  })
})
