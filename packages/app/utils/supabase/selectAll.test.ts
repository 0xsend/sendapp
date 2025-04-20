import { test, jest, expect } from '@jest/globals'
import { selectAll } from './selectAll'

test('successfully fetches all rows with pagination', async () => {
  // Mock data for pagination
  const pageSize = 100
  const totalRows = 250
  const mockData = Array.from({ length: totalRows }, (_, i) => ({ id: i + 1 }))

  // Mock queryBuilder
  const mockQueryBuilder = {
    range: jest.fn().mockImplementation((start, end) => {
      // @ts-expect-error - testing
      const pageData = mockData.slice(start, end + 1)
      return Promise.resolve({ data: pageData, count: totalRows, error: null })
    }),
  }

  // @ts-expect-error: This is a mock
  const { data, count, error } = (await selectAll(mockQueryBuilder)) as ReturnType<typeof selectAll>

  expect(data?.length).toBe(totalRows)
  expect(mockData).toEqual(data)
  expect(count).toBe(totalRows)
  expect(error).toBe(null)
  expect(mockQueryBuilder.range).toHaveBeenCalledTimes(Math.ceil(totalRows / pageSize))
})

test('handles empty results', async () => {
  const mockQueryBuilder = {
    range: jest.fn().mockImplementation(() => {
      return Promise.resolve({ data: [], count: 0, error: null })
    }),
  }

  // @ts-expect-error: This is a mock
  const { data, count, error } = (await selectAll(mockQueryBuilder)) as ReturnType<typeof selectAll>

  expect(data?.length).toBe(0)
  expect(count).toBe(0)
  expect(error).toBe(null)
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
        // @ts-expect-error - testing
        expect(end - start).toBe(defaultPageSize - 1)
      } else {
        // @ts-expect-error - testing
        expect(end - start).toBe(pageSize - 1)
      }
      // @ts-expect-error - testing
      const pageData = mockData.slice(start, start + pageSize)
      firstPage = false
      return Promise.resolve({ data: pageData, count: totalRows, error: null })
    }),
  }

  // @ts-expect-error: This is a mock
  const { data, count, error } = (await selectAll(mockQueryBuilder)) as ReturnType<typeof selectAll>

  expect(data).toEqual(mockData)
  expect(count).toBe(totalRows)
  expect(error).toBe(null)
  expect(mockQueryBuilder.range).toHaveBeenCalledTimes(5)
})

test('handles one page of results', async () => {
  const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }]
  const mockQueryBuilder = {
    range: jest.fn().mockImplementation(() => {
      return Promise.resolve({ data: mockData, count: mockData.length, error: null })
    }),
  }

  // @ts-expect-error: This is a mock
  const { data, count, error } = (await selectAll(mockQueryBuilder)) as ReturnType<typeof selectAll>

  expect(data).toEqual(mockData)
  expect(count).toBe(mockData.length)
  expect(error).toBe(null)
  expect(mockQueryBuilder.range).toHaveBeenCalledTimes(1)
})

test('handles errors from the query builder', async () => {
  const errorMessage = 'Error fetching data'
  const mockQueryBuilder = {
    range: jest.fn().mockImplementation(() => {
      return Promise.resolve({ data: null, count: null, error: { message: errorMessage } })
    }),
  }

  // @ts-expect-error: This is a mock
  const { data, count, error } = (await selectAll(mockQueryBuilder)) as ReturnType<typeof selectAll>

  expect(data).toBe(null)
  expect(count).toBe(null)
  expect(error?.message).toBe(errorMessage)
})

test('asserts count is not null', async () => {
  const mockQueryBuilder = {
    range: jest.fn().mockImplementation(() => {
      return Promise.resolve({ data: [], count: null, error: null })
    }),
  }

  // @ts-expect-error: This is a mock
  const { data, count, error } = (await selectAll(mockQueryBuilder)) as ReturnType<typeof selectAll>

  expect(data).toBe(null)
  expect(count).toBe(null)
  expect(error?.message).toBe(
    'Count is null. Be sure to use the "exact" option when calling selectAll'
  )
})
