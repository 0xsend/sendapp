import { useState, useCallback, useMemo } from 'react'
import type {
  SendSuggestionItem,
  SendSuggestionsQueryResult,
} from 'app/features/send/suggestions/SendSuggestion.types'

const FIRST_NAMES = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Ethan',
  'Fiona',
  'George',
  'Hannah',
  'Ivan',
  'Julia',
  'Kevin',
  'Lisa',
  'Mike',
  'Nancy',
  'Oscar',
  'Patricia',
  'Quinn',
  'Rachel',
  'Steve',
  'Tina',
  'Uma',
  'Victor',
  'Wendy',
  'Xavier',
  'Yara',
  'Zack',
  'Amber',
  'Brian',
  'Chloe',
  'Derek',
  'Emma',
  'Frank',
  'Grace',
  'Henry',
  'Iris',
  'Jack',
  'Kate',
  'Leo',
  'Maya',
  'Noah',
  'Olivia',
  'Paul',
  'Rose',
  'Sam',
  'Tom',
  'Vera',
  'Will',
  'Zoe',
  'Adam',
  'Beth',
  'Carl',
  'Dana',
  'Eric',
  'Faye',
]

const LAST_NAMES = [
  'Johnson',
  'Smith',
  'Brown',
  'Prince',
  'Hunt',
  'Green',
  'Lucas',
  'Montana',
  'Drago',
  'Roberts',
  'Hart',
  'Simpson',
  'Ross',
  'Drew',
  'Wilson',
  'Taylor',
  'Anderson',
  'Thomas',
  'Jackson',
  'White',
  'Harris',
  'Martin',
  'Thompson',
  'Garcia',
  'Martinez',
  'Robinson',
  'Clark',
  'Rodriguez',
  'Lewis',
  'Lee',
  'Walker',
  'Hall',
  'Allen',
  'Young',
  'King',
  'Wright',
  'Lopez',
  'Hill',
  'Scott',
  'Adams',
  'Baker',
  'Nelson',
  'Carter',
  'Mitchell',
  'Perez',
  'Turner',
  'Phillips',
  'Campbell',
  'Parker',
  'Evans',
  'Edwards',
  'Collins',
  'Stewart',
  'Sanchez',
]

const createMockSuggestionItem = (
  sendId: number,
  overrides: Partial<SendSuggestionItem> = {}
): SendSuggestionItem => ({
  id: null,
  name: null,
  avatar_url: null,
  send_id: sendId,
  main_tag_id: null,
  main_tag_name: null,
  tags: [],
  is_verified: false,
  ...overrides,
})

const generateMockSenders = (baseId: number, count: number, seed = 0): SendSuggestionItem[] => {
  return Array.from({ length: count }, (_, i) => {
    const idx = (i + seed) % FIRST_NAMES.length
    const lastIdx = (i + seed + 7) % LAST_NAMES.length
    const firstName = FIRST_NAMES[idx] as string
    const lastName = LAST_NAMES[lastIdx] as string
    const tagName = `${firstName.toLowerCase()}${i > 0 ? i : ''}`

    return createMockSuggestionItem(baseId + i, {
      name: `${firstName} ${lastName}`,
      main_tag_name: tagName,
      tags: [tagName, `${firstName.toLowerCase()}_${lastName.toLowerCase().slice(0, 1)}`],
      avatar_url: `https://i.pravatar.cc/150?u=${tagName}${baseId}`,
      is_verified: i % 3 === 0,
    })
  })
}

// Generate 50 items per category
export const mockRecentSenders: SendSuggestionItem[] = generateMockSenders(1000, 50, 0)
export const mockFavoriteSenders: SendSuggestionItem[] = generateMockSenders(2000, 50, 10)
export const mockTopSenders: SendSuggestionItem[] = generateMockSenders(3000, 50, 20)
export const mockBirthdaySenders: SendSuggestionItem[] = generateMockSenders(4000, 50, 30)

export const PAGE_SIZE = 10

export const createMockQuery = (data: SendSuggestionItem[]): SendSuggestionsQueryResult =>
  ({
    data: {
      pages: [data],
      pageParams: [undefined],
    },
    error: null,
    isError: false,
    isPending: false,
    isLoading: false,
    isLoadingError: false,
    isRefetchError: false,
    isSuccess: true,
    status: 'success',
    fetchNextPage: () => Promise.resolve({} as SendSuggestionsQueryResult),
    fetchPreviousPage: () => Promise.resolve({} as SendSuggestionsQueryResult),
    hasNextPage: false,
    hasPreviousPage: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isRefetching: false,
    isStale: false,
    isPlaceholderData: false,
    refetch: () => Promise.resolve({} as SendSuggestionsQueryResult),
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    fetchStatus: 'idle',
    promise: Promise.resolve({} as SendSuggestionsQueryResult['data']),
  }) as unknown as SendSuggestionsQueryResult

export const useMockQuery = (allData: SendSuggestionItem[]): SendSuggestionsQueryResult => {
  const [pages, setPages] = useState<SendSuggestionItem[][]>(() => [allData.slice(0, PAGE_SIZE)])
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)

  const totalPages = Math.ceil(allData.length / PAGE_SIZE)
  const currentPage = pages.length - 1
  const hasNextPage = currentPage < totalPages - 1

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return {} as SendSuggestionsQueryResult

    setIsFetchingNextPage(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    const nextPageIndex = pages.length
    const start = nextPageIndex * PAGE_SIZE
    const end = start + PAGE_SIZE
    const nextPageData = allData.slice(start, end)

    setPages((prev) => [...prev, nextPageData])
    setIsFetchingNextPage(false)

    return {} as SendSuggestionsQueryResult
  }, [hasNextPage, isFetchingNextPage, pages.length, allData])

  return useMemo(
    () =>
      ({
        data: {
          pages,
          pageParams: pages.map((_, i) => (i === 0 ? undefined : i)),
        },
        error: null,
        isError: false,
        isPending: false,
        isLoading: false,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: true,
        status: 'success',
        fetchNextPage,
        fetchPreviousPage: () => Promise.resolve({} as SendSuggestionsQueryResult),
        hasNextPage,
        hasPreviousPage: false,
        isFetchingNextPage,
        isFetchingPreviousPage: false,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isRefetching: false,
        isStale: false,
        isPlaceholderData: false,
        refetch: () => Promise.resolve({} as SendSuggestionsQueryResult),
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        fetchStatus: 'idle',
        promise: Promise.resolve({} as SendSuggestionsQueryResult['data']),
      }) as unknown as SendSuggestionsQueryResult,
    [pages, fetchNextPage, hasNextPage, isFetchingNextPage]
  )
}
