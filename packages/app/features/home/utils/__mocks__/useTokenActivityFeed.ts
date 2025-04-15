import { jest } from '@jest/globals'
import { SendAccountTransfersEventSchema } from 'app/utils/zod/activity'
import { mockUsdcTransfers } from './mock-usdc-transfers'

const tokenTransfersByLogAddr = {
  '\\x833589fcd6edb6e08f4c7c32d4f71b54bda02913': mockUsdcTransfers.map((t) =>
    SendAccountTransfersEventSchema.parse(t)
  ),
}

const mockUseTokenActivityFeed = jest.fn(({ address }) => {
  const pages = tokenTransfersByLogAddr[address]
  if (!pages) throw new Error('No pages found')
  return {
    data: {
      pages: [tokenTransfersByLogAddr[address]],
    },
    isLoading: false,
    error: null,
  }
})
export const useTokenActivityFeed = mockUseTokenActivityFeed
