import '@jest/globals'

import { TamaguiProvider, config } from '@my/ui'
import { usdcCoin } from 'app/data/coins'
import { TokenDetails } from './TokenDetails'
import { act, render, screen } from '@testing-library/react-native'

jest.mock('app/features/home/utils/useTokenActivityFeed')

test('TokenDetails', async () => {
  jest.useFakeTimers()
  render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <TokenDetails coin={usdcCoin} />
    </TamaguiProvider>
  )
  await act(async () => {
    jest.advanceTimersByTime(2000)
    jest.runAllTimers()
  })
  expect(screen.toJSON()).toMatchSnapshot()

  expect(screen.getByText('Sent')).toBeOnTheScreen()
  expect(screen.getByText('Deposit')).toBeOnTheScreen()
  expect(screen.getByText('Received')).toBeOnTheScreen()
  expect(screen.getByText('/alice')).toBeOnTheScreen()
  expect(screen.getByText('0xa71CE00000000000000000000000000000000000')).toBeOnTheScreen()
  expect(screen.getByText('0x93F2FA7A16a7365e3895b0F6E6Ac7a832d6c761a')).toBeOnTheScreen()
  expect(screen.getByText('10 USDC')).toBeOnTheScreen()
  expect(screen.getByText('20 USDC')).toBeOnTheScreen()
  expect(screen.getByText('30 USDC')).toBeOnTheScreen()
})
