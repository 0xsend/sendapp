import '@jest/globals'

import { TamaguiProvider, config } from '@my/ui'
import { usdcCoin } from 'app/data/coins'
import { TokenDetails } from './TokenDetails'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native'

jest.mock('app/features/home/utils/useTokenActivityFeed')

test('TokenDetails', () => {
  const tree = render(
    <TamaguiProvider defaultTheme={'dark'} config={config}>
      <TokenDetails coin={usdcCoin} />
    </TamaguiProvider>
  ).toJSON()
  expect(tree).toMatchSnapshot()

  expect(screen.getByText('Sent')).toBeOnTheScreen()
  expect(screen.getAllByText('Received')).toHaveLength(2)
  expect(screen.getByText('@alice')).toBeOnTheScreen()
  expect(screen.getByText('0xa71CE00000000000000000000000000000000000')).toBeOnTheScreen()
  expect(screen.getByText('0x93F2FA7A16a7365e3895b0F6E6Ac7a832d6c761a')).toBeOnTheScreen()
  expect(screen.getByText('10 USDC')).toBeOnTheScreen()
  expect(screen.getByText('20 USDC')).toBeOnTheScreen()
  expect(screen.getByText('30 USDC')).toBeOnTheScreen()
})
