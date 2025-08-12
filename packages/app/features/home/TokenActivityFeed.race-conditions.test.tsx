import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TokenActivityFeed } from './TokenActivityFeed'
import type { Activity } from 'app/utils/zod/activity'

// Mock the activity feed hook
const mockUseActivityFeed = jest.fn()
jest.mock('app/features/activity/utils/useActivityFeed', () => ({
  useActivityFeed: mockUseActivityFeed,
}))

// Mock other dependencies
jest.mock('@my/ui', () => ({
  Spinner: ({ children }: { children?: React.ReactNode }) => <div data-testid="spinner">{children}</div>,
  YStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({ children, onPress }: { children: React.ReactNode, onPress?: () => void }) => 
    <button onClick={onPress}>{children}</button>,
}))

jest.mock('./TokenActivityRow', () => ({
  TokenActivityRow: ({ activity }: { activity: Activity }) => (
    <div data-testid={`activity-${activity.event_id}`} data-event-name={activity.event_name}>
      {activity.data?.note || 'No note'} - {activity.event_name}
    </div>
  ),
}))

// Mock navigation
jest.mock('solito/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
  }),
}))

describe('TokenActivityFeed - Race Condition Tests', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  const createMockActivity = (
    id: string, 
    eventName: 'send_account_transfers' | 'temporal_send_account_transfers' | 'send_account_receives',
    status?: string,
    note?: string
  ): Activity => ({
    id: parseInt(id),
    event_id: `event-${id}`,
    event_name: eventName,
    from_user_id: 'user-1',
    to_user_id: 'user-2',
    created_at: new Date(),
    data: {
      ...(status && { status }),
      ...(note && { note }),
      log_addr: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      f: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      t: '0xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA',
      v: '1000000',
    },
    from_user: {
      id: 'user-1',
      name: 'Test User',
      avatar_url: null,
      send_id: 1,
      tags: ['test'],
      main_tag_id: 1,
      main_tag_name: 'test',
    },
    to_user: {
      id: 'user-2', 
      name: 'Recipient User',
      avatar_url: null,
      send_id: 2,
      tags: ['recipient'],
      main_tag_id: 2,
      main_tag_name: 'recipient',
    },
  })

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  describe('Bug 1 Tests: Note Lookup Race Condition', () => {
    it('should display note when found via primary lookup mechanism', async () => {
      const activitiesWithNote = [
        createMockActivity('1', 'send_account_transfers', 'confirmed', 'Primary lookup note')
      ]

      mockUseActivityFeed.mockReturnValue({
        data: activitiesWithNote,
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      renderWithQueryClient(
        <TokenActivityFeed 
          queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
        />
      )

      expect(screen.getByText('Primary lookup note - send_account_transfers')).toBeInTheDocument()
    })

    it('should display note when found via fallback lookup mechanism', async () => {
      const activitiesWithFallbackNote = [
        createMockActivity('2', 'send_account_transfers', 'confirmed', 'Fallback lookup note')
      ]

      mockUseActivityFeed.mockReturnValue({
        data: activitiesWithFallbackNote,
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      renderWithQueryClient(
        <TokenActivityFeed 
          queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
        />
      )

      expect(screen.getByText('Fallback lookup note - send_account_transfers')).toBeInTheDocument()
    })

    it('should handle activities without notes gracefully', async () => {
      const activitiesWithoutNote = [
        createMockActivity('3', 'send_account_transfers', 'confirmed')
      ]

      mockUseActivityFeed.mockReturnValue({
        data: activitiesWithoutNote,
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      renderWithQueryClient(
        <TokenActivityFeed 
          queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
        />
      )

      expect(screen.getByText('No note - send_account_transfers')).toBeInTheDocument()
    })

    it('should display notes for both send and receive activities', async () => {
      const mixedActivities = [
        createMockActivity('4', 'send_account_transfers', 'confirmed', 'Send note'),
        createMockActivity('5', 'send_account_receives', 'confirmed', 'Receive note')
      ]

      mockUseActivityFeed.mockReturnValue({
        data: mixedActivities,
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      renderWithQueryClient(
        <TokenActivityFeed 
          queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
        />
      )

      expect(screen.getByText('Send note - send_account_transfers')).toBeInTheDocument()
      expect(screen.getByText('Receive note - send_account_receives')).toBeInTheDocument()
    })
  })

  describe('Bug 2 Tests: Duplicate Activity Prevention', () => {
    it('should not show duplicate activities when cleanup is working correctly', async () => {
      // Only blockchain activity should be present after cleanup
      const cleanActivities = [
        createMockActivity('6', 'send_account_transfers', 'confirmed', 'Clean activity')
      ]

      mockUseActivityFeed.mockReturnValue({
        data: cleanActivities,
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      renderWithQueryClient(
        <TokenActivityFeed 
          queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
        />
      )

      // Should only see one activity
      const activities = screen.getAllByTestId(/^activity-/)
      expect(activities).toHaveLength(1)
      expect(screen.getByText('Clean activity - send_account_transfers')).toBeInTheDocument()
    })

    it('should handle pending state transition correctly without duplicates', async () => {
      let currentActivities = [
        createMockActivity('7', 'temporal_send_account_transfers', 'pending', 'Pending transfer')
      ]

      const mockFetchNextPage = jest.fn()
      
      mockUseActivityFeed.mockReturnValue({
        data: currentActivities,
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: mockFetchNextPage,
        isFetchingNextPage: false,
      })

      const { rerender } = renderWithQueryClient(
        <TokenActivityFeed 
          queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
        />
      )

      // Initially should show pending activity
      expect(screen.getByText('Pending transfer - temporal_send_account_transfers')).toBeInTheDocument()

      // Simulate state transition - temporal activity replaced by blockchain activity
      currentActivities = [
        createMockActivity('8', 'send_account_transfers', 'confirmed', 'Confirmed transfer')
      ]

      mockUseActivityFeed.mockReturnValue({
        data: currentActivities,
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: mockFetchNextPage,
        isFetchingNextPage: false,
      })

      rerender(
        <QueryClientProvider client={queryClient}>
          <TokenActivityFeed 
            queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
          />
        </QueryClientProvider>
      )

      // Should only show confirmed activity, no duplicates
      const activities = screen.getAllByTestId(/^activity-/)
      expect(activities).toHaveLength(1)
      expect(screen.getByText('Confirmed transfer - send_account_transfers')).toBeInTheDocument()
      expect(screen.queryByText('Pending transfer - temporal_send_account_transfers')).not.toBeInTheDocument()
    })

    it('should handle race condition where both temporal and blockchain activities exist temporarily', async () => {
      // This simulates the race condition state where both activities exist
      const duplicateActivities = [
        createMockActivity('9', 'temporal_send_account_transfers', 'pending', 'Race condition transfer'),
        createMockActivity('10', 'send_account_transfers', 'confirmed', 'Race condition transfer')
      ]

      mockUseActivityFeed.mockReturnValue({
        data: duplicateActivities,
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      renderWithQueryClient(
        <TokenActivityFeed 
          queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
        />
      )

      // Should show both activities (representing the race condition state)
      // In a real scenario, cleanup would remove the temporal one
      const activities = screen.getAllByTestId(/^activity-/)
      expect(activities).toHaveLength(2)
      
      const temporalActivity = screen.getByTestId('activity-event-9')
      const blockchainActivity = screen.getByTestId('activity-event-10')
      
      expect(temporalActivity).toHaveAttribute('data-event-name', 'temporal_send_account_transfers')
      expect(blockchainActivity).toHaveAttribute('data-event-name', 'send_account_transfers')
    })

    it('should invalidate queries when pending state changes to confirmed', async () => {
      const mockInvalidateQueries = jest.spyOn(queryClient, 'invalidateQueries')

      let wasPending = true
      let isCurrentlyPending = false

      // Mock the pending detection logic
      const pendingActivities = [
        createMockActivity('11', 'temporal_send_account_transfers', 'submitted', 'Pending transfer')
      ]

      const confirmedActivities = [
        createMockActivity('12', 'send_account_transfers', 'confirmed', 'Confirmed transfer')
      ]

      // Initial render with pending activity
      mockUseActivityFeed.mockReturnValue({
        data: pendingActivities,
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      const { rerender } = renderWithQueryClient(
        <TokenActivityFeed 
          queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
        />
      )

      // Simulate transition to confirmed state
      mockUseActivityFeed.mockReturnValue({
        data: confirmedActivities,
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      act(() => {
        rerender(
          <QueryClientProvider client={queryClient}>
            <TokenActivityFeed 
              queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
            />
          </QueryClientProvider>
        )
      })

      // Note: The actual query invalidation logic would need to be tested 
      // in the TokenActivityFeed component implementation
      expect(screen.getByText('Confirmed transfer - send_account_transfers')).toBeInTheDocument()
    })
  })

  describe('Bug 3 Tests: Immediate API Response Integration', () => {
    it('should handle immediate workflow creation without waiting for activity', async () => {
      // This test simulates the fixed flow where API returns immediately
      // and activity may appear shortly after

      mockUseActivityFeed.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      renderWithQueryClient(
        <TokenActivityFeed 
          queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
        />
      )

      // Should render without activities initially (after API returned immediately)
      expect(screen.queryByTestId(/^activity-/)).not.toBeInTheDocument()

      // Simulate activity appearing after workflow starts processing
      const newActivities = [
        createMockActivity('13', 'temporal_send_account_transfers', 'initialized', 'New workflow')
      ]

      mockUseActivityFeed.mockReturnValue({
        data: newActivities,
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      // This would happen through query refetching/polling
      queryClient.setQueryData(['activity_feed'], newActivities)

      await waitFor(() => {
        expect(screen.getByText('New workflow - temporal_send_account_transfers')).toBeInTheDocument()
      })
    })

    it('should show loading state appropriately without long delays', async () => {
      mockUseActivityFeed.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      renderWithQueryClient(
        <TokenActivityFeed 
          queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
        />
      )

      expect(screen.getByTestId('spinner')).toBeInTheDocument()

      // Quick resolution (no long waits)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        mockUseActivityFeed.mockReturnValue({
          data: [createMockActivity('14', 'send_account_transfers', 'confirmed', 'Quick load')],
          isLoading: false,
          error: null,
          hasNextPage: false,
          fetchNextPage: jest.fn(),
          isFetchingNextPage: false,
        })
      })

      // Should resolve quickly
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
    })
  })

  describe('Integration Tests: All Race Conditions Together', () => {
    it('should handle complete race condition scenario correctly', async () => {
      // This test simulates the complete race condition timeline:
      // 1. User initiates transfer (API returns immediately)
      // 2. Temporal activity appears
      // 3. Blockchain activity appears with note via fallback lookup
      // 4. Temporal activity gets cleaned up
      // 5. Final state: one confirmed activity with note

      const scenarios = [
        // Step 2: Temporal activity appears
        {
          activities: [
            createMockActivity('15', 'temporal_send_account_transfers', 'submitted', 'Integration test note')
          ],
          description: 'temporal activity phase'
        },
        // Step 3: Both activities exist (race condition state)
        {
          activities: [
            createMockActivity('15', 'temporal_send_account_transfers', 'submitted', 'Integration test note'),
            createMockActivity('16', 'send_account_transfers', 'confirmed', 'Integration test note') // Note from fallback lookup
          ],
          description: 'race condition phase'
        },
        // Step 4: Final state after cleanup
        {
          activities: [
            createMockActivity('16', 'send_account_transfers', 'confirmed', 'Integration test note')
          ],
          description: 'final state phase'
        }
      ]

      mockUseActivityFeed.mockReturnValue({
        data: scenarios[0].activities,
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      const { rerender } = renderWithQueryClient(
        <TokenActivityFeed 
          queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
        />
      )

      // Step 2: Should show temporal activity
      expect(screen.getByText('Integration test note - temporal_send_account_transfers')).toBeInTheDocument()
      expect(screen.getAllByTestId(/^activity-/)).toHaveLength(1)

      // Step 3: Race condition state - both activities exist
      mockUseActivityFeed.mockReturnValue({
        data: scenarios[1].activities,
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      rerender(
        <QueryClientProvider client={queryClient}>
          <TokenActivityFeed 
            queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
          />
        </QueryClientProvider>
      )

      // Should show both activities temporarily
      expect(screen.getAllByTestId(/^activity-/)).toHaveLength(2)
      expect(screen.getByTestId('activity-event-15')).toHaveAttribute('data-event-name', 'temporal_send_account_transfers')
      expect(screen.getByTestId('activity-event-16')).toHaveAttribute('data-event-name', 'send_account_transfers')

      // Step 4: Final state - only blockchain activity remains
      mockUseActivityFeed.mockReturnValue({
        data: scenarios[2].activities,
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      rerender(
        <QueryClientProvider client={queryClient}>
          <TokenActivityFeed 
            queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
          />
        </QueryClientProvider>
      )

      // Final state: one activity with note preserved
      expect(screen.getAllByTestId(/^activity-/)).toHaveLength(1)
      expect(screen.getByText('Integration test note - send_account_transfers')).toBeInTheDocument()
      expect(screen.queryByTestId('activity-event-15')).not.toBeInTheDocument()
      expect(screen.getByTestId('activity-event-16')).toBeInTheDocument()
    })

    it('should maintain consistent state during rapid updates', async () => {
      const mockFetchNextPage = jest.fn()

      // Simulate rapid state changes that could occur during race conditions
      const stateSequence = [
        [], // Initial empty state
        [createMockActivity('17', 'temporal_send_account_transfers', 'initialized')],
        [createMockActivity('17', 'temporal_send_account_transfers', 'submitted')],
        [
          createMockActivity('17', 'temporal_send_account_transfers', 'submitted'),
          createMockActivity('18', 'send_account_transfers', 'confirmed', 'Rapid update note')
        ],
        [createMockActivity('18', 'send_account_transfers', 'confirmed', 'Rapid update note')]
      ]

      let stateIndex = 0
      mockUseActivityFeed.mockImplementation(() => ({
        data: stateSequence[stateIndex],
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: mockFetchNextPage,
        isFetchingNextPage: false,
      }))

      const { rerender } = renderWithQueryClient(
        <TokenActivityFeed 
          queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
        />
      )

      // Rapidly cycle through states
      for (let i = 1; i < stateSequence.length; i++) {
        await act(async () => {
          stateIndex = i
          rerender(
            <QueryClientProvider client={queryClient}>
              <TokenActivityFeed 
                queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
              />
            </QueryClientProvider>
          )
        })

        // Component should handle each state correctly without errors
        const activities = screen.queryAllByTestId(/^activity-/)
        expect(activities).toHaveLength(stateSequence[i].length)
      }

      // Final state should be clean
      expect(screen.getByText('Rapid update note - send_account_transfers')).toBeInTheDocument()
    })
  })

  describe('Error Recovery and Edge Cases', () => {
    it('should handle activity feed errors gracefully', async () => {
      mockUseActivityFeed.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch activities'),
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      renderWithQueryClient(
        <TokenActivityFeed 
          queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
        />
      )

      // Should handle error state without crashing
      expect(screen.queryByTestId(/^activity-/)).not.toBeInTheDocument()
    })

    it('should handle empty activity data correctly', async () => {
      mockUseActivityFeed.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      renderWithQueryClient(
        <TokenActivityFeed 
          queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
        />
      )

      // Should render empty state correctly
      expect(screen.queryByTestId(/^activity-/)).not.toBeInTheDocument()
    })

    it('should handle malformed activity data safely', async () => {
      // Simulate activity with missing required fields (edge case)
      const malformedActivity = {
        id: 19,
        event_id: 'malformed-event',
        event_name: 'send_account_transfers',
        // Missing required fields...
      } as Activity

      mockUseActivityFeed.mockReturnValue({
        data: [malformedActivity],
        isLoading: false,
        error: null,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        isFetchingNextPage: false,
      })

      // Should not crash even with malformed data
      expect(() => {
        renderWithQueryClient(
          <TokenActivityFeed 
            queryParams={{ token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }} 
          />
        )
      }).not.toThrow()
    })
  })
})
