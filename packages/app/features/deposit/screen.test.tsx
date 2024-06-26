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
    await waitFor(() => expect(screen.getByText('Deposit funds')).toBeVisible())
    await waitFor(() => expect(screen.getByText('Web3 Wallet')).toBeVisible())
    // await waitFor(() => expect(screen.getByText('Coinbase Pay')).toBeVisible())
    await waitFor(() => expect(screen.getByText('Coming Soon')).toBeVisible())
    expect(screen).toMatchSnapshot()
  })
})
