import '@jest/globals'

import { TamaguiProvider, config } from '@my/ui'
import { usdcCoin } from 'app/data/coins'
import { TokenDetails } from './TokenDetails'
import { act, render, screen } from '@testing-library/react-native'

jest.mock('app/features/home/utils/useTokenActivityFeed')

jest.mock('app/utils/useTokenPrices', () => ({
  useTokenPrices: jest.fn().mockReturnValue({
    data: { 'usd-coin': { usd: 1 }, ethereum: { usd: 1 }, 'send-token': { usd: 1 } },
  }),
}))

test('TokenDetails', async () => {
  jest.useFakeTimers()

  render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <TokenDetails coin={{ ...usdcCoin, balance: 1n }} />
    </TamaguiProvider>
  )

  await act(async () => {
    jest.advanceTimersByTime(2000)
    jest.runAllTimers()
  })

  expect(screen.toJSON()).toMatchSnapshot()

  expect(screen.getByText('Withdraw')).toBeOnTheScreen()
  expect(screen.getByText('Deposit')).toBeOnTheScreen()
  expect(screen.getByText('Received')).toBeOnTheScreen()
  expect(screen.getByText('/alice')).toBeOnTheScreen()
  expect(screen.getByText('0xa71...0000')).toBeOnTheScreen()
  expect(screen.getByText('0x93F...761a')).toBeOnTheScreen()
  expect(screen.getByText('10 USDC')).toBeOnTheScreen()
  expect(screen.getByText('20 USDC')).toBeOnTheScreen()
  expect(screen.getByText('30 USDC')).toBeOnTheScreen()
})
