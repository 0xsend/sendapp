import { SendAccountTransfersEventSchema } from 'app/utils/zod/activity'
import { mockUsdcTransfers } from './mock-usdc-transfers'
import { hexToBytea } from 'app/utils/hexToBytea'

const tokenTransfersByLogAddr = {
  '\\x833589fcd6edb6e08f4c7c32d4f71b54bda02913': mockUsdcTransfers.map((t) =>
    SendAccountTransfersEventSchema.parse(t)
  ),
}

const mockUseTokenActivityFeed = jest.fn(({ token }) => {
  const logAddress = hexToBytea(token)
  const pages = tokenTransfersByLogAddr[logAddress]
  if (!pages) throw new Error('No pages found')
  return {
    pendingTransfers: {
      data: [], //@todo maybe writes some mock data for temporal?
      isLoading: false,
      error: null,
    },
    activityFeed: {
      data: {
        pages: [tokenTransfersByLogAddr[logAddress]],
      },
      isLoading: false,
      error: null,
    },
  }
})
export const useTokenActivityFeed = mockUseTokenActivityFeed
