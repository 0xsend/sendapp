import { EventArraySchema } from 'app/utils/zod/activity'
import { MockActivityFeed } from './mock-activity-feed'
import { jest } from '@jest/globals'

export const useActivityFeed = jest.fn().mockReturnValue({
  data: {
    pages: [EventArraySchema.parse(MockActivityFeed)],
  },
  isLoading: false,
  error: null,
})

export default {
  useActivityFeed,
}
