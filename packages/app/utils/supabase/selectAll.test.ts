import { test } from '@jest/globals'
import { selectAll } from './selectAll'

test('successfully fetches all rows with pagination', async () => {
  // Mock data for pagination
  const pageSize = 100
  const totalRows = 250
  const mockData = Array.from({ length: totalRows }, (_, i) => ({ id: i + 1 }))

  // Mock queryBuilder
  const mockQueryBuilder = {
    range: jest.fn().mockImplementation((start, end) => {
      const pageData = mockData.slice(start, end + 1)
      return Promise.resolve({ data: pageData, count: totalRows })
    }),
  }

  // @ts-expect-error: This is a mock
  // biome-ignore lint/suspicious/noExplicitAny: this is a mock
  const results = (await selectAll(mockQueryBuilder)) as any[]

  expect(results.length).toBe(totalRows)
  expect(mockData).toEqual(results)
  expect(mockQueryBuilder.range).toHaveBeenCalledTimes(Math.ceil(totalRows / pageSize))
})

test('handles empty results', async () => {
  const mockQueryBuilder = {
    range: jest.fn().mockImplementation(() => {
      return Promise.resolve({ data: [], count: 0 })
    }),
  }

  // @ts-expect-error: This is a mock
  // biome-ignore lint/suspicious/noExplicitAny: this is a mock
  const results = (await selectAll(mockQueryBuilder)) as any[]

  expect(results.length).toBe(0)
  expect(mockQueryBuilder.range).toHaveBeenCalledTimes(1)
})

test('handles actual page size smaller than default', async () => {
  const defaultPageSize = 100
  const pageSize = 10
  const totalRows = 45
  const mockData = Array.from({ length: totalRows }, (_, i) => ({ id: i + 1 }))
  let firstPage = true
  // Mock queryBuilder
  const mockQueryBuilder = {
    range: jest.fn().mockImplementation((start, end) => {
      if (firstPage) {
        expect(end - start).toBe(defaultPageSize - 1)
      } else {
        expect(end - start).toBe(pageSize - 1)
      }
      const pageData = mockData.slice(start, start + pageSize)
      firstPage = false
      return Promise.resolve({ data: pageData, count: totalRows })
    }),
  }

  // @ts-expect-error: This is a mock
  const results = await selectAll(mockQueryBuilder)

  expect(results).toEqual(mockData)
  expect(mockQueryBuilder.range).toHaveBeenCalledTimes(5)
})

test('handles one page of results', async () => {
  const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }]
  const mockQueryBuilder = {
    range: jest.fn().mockImplementation(() => {
      return Promise.resolve({ data: mockData, count: mockData.length })
    }),
  }

  // @ts-expect-error: This is a mock
  const results = await selectAll(mockQueryBuilder)

  expect(results).toEqual(mockData)
  expect(mockQueryBuilder.range).toHaveBeenCalledTimes(1)
})

test('handles errors from the query builder', async () => {
  const errorMessage = 'Error fetching data'
  const mockQueryBuilder = {
    range: jest.fn().mockImplementation(() => {
      return Promise.reject(new Error(errorMessage))
    }),
  }

  // @ts-expect-error: This is a mock
  await expect(selectAll(mockQueryBuilder)).rejects.toThrow(errorMessage)
})

test('asserts count is not null', async () => {
  const mockQueryBuilder = {
    range: jest.fn().mockImplementation(() => {
      return Promise.resolve({ count: null })
    }),
  }

  // @ts-expect-error: This is a mock
  await expect(selectAll(mockQueryBuilder)).rejects.toThrow('Count is null')
})
