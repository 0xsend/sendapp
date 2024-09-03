import '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react-native'
import { Provider } from 'app/__mocks__/app/provider'
import { DepositScreen } from './screen'

jest.mock('wagmi')

jest.mock('@my/ui', () => ({
  ...jest.requireActual('@my/ui'),
  Fade: ({ children }) => children,
}))

describe('DepositScreen', () => {
  it('renders the deposit screen', async () => {
    render(
      <Provider>
        <DepositScreen />
      </Provider>
    )

    // screen.debug({ message: 'DepositScreen: render' })
    await waitFor(() => expect(screen.getByText('Deposit on Base')).toBeVisible())
    expect(screen).toMatchSnapshot()
  })
})
