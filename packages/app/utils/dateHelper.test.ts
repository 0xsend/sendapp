import { describe, expect, it } from '@jest/globals'
import {
  adjustUTCDateForTimezone,
  CommentsTime,
  formatDateToLongForm,
  formatDateToLongFormWithoutYear,
  formatDateToSupabaseFormat,
  parseSupabaseDateStringToDate,
} from './dateHelper'
describe('CommentsTime', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2021-08-01').getTime())
  })
  afterAll(() => {
    jest.useRealTimers()
  })
  it('time should be 0 sec ago', () => {
    expect(CommentsTime(new Date())).toBe('0 sec ago')
  })
  it('time should be 4 day ago', () => {
    const dateObj = new Date()
    dateObj.setDate(dateObj.getDate() - 4)
    expect(CommentsTime(dateObj)).toBe('4 days ago')
  })
  it('time should be 1 mon ago', () => {
    const dateObj = new Date()
    dateObj.setDate(dateObj.getDate() - 30)
    expect(CommentsTime(dateObj)).toBe('1 mon ago')
  })
  it('time should be 1 year ago', () => {
    const dateObj = new Date()
    dateObj.setDate(dateObj.getDate() - 365)
    expect(CommentsTime(dateObj)).toBe('1 year ago')
  })
})

describe('adjustUTCDateForTimezone', () => {
  // UTC+1
  const baseDate = new Date(1688137919000 + 60 * 60 * 1000)

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(baseDate)
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('should correctly adjust time for UTC+1 timezone', () => {
    const result = adjustUTCDateForTimezone(baseDate, 60)

    expect(result).toBeInstanceOf(Date)

    expect(result.getTime()).toBe(baseDate.getTime())
  })
})

describe('formatDateToLongForm', () => {
  it('should handle single-digit days correctly', () => {
    const date = new Date('2024-02-05')
    expect(formatDateToLongForm(date)).toBe('5 February 2024')
  })

  it('should handle undefined input', () => {
    expect(formatDateToLongForm()).toBe('')
  })

  it('should throw an error for an invalid date', () => {
    const invalidDate = new Date('invalid-date')
    expect(() => formatDateToLongForm(invalidDate)).toThrow('Invalid date provided.')
  })
})

describe('formatDateToLongFormWithoutYear', () => {
  it('should handle single-digit days correctly', () => {
    const date = new Date('2024-02-05')
    expect(formatDateToLongFormWithoutYear(date)).toBe('5 February')
  })

  it('should handle undefined input', () => {
    expect(formatDateToLongFormWithoutYear()).toBe('')
  })

  it('should throw an error for an invalid date', () => {
    const invalidDate = new Date('invalid-date')
    expect(() => formatDateToLongFormWithoutYear(invalidDate)).toThrow('Invalid date provided.')
  })
})

describe('formatDateToSupabaseFormat', () => {
  test('should format a standard date correctly', () => {
    const date = new Date(2024, 11, 6)
    const result = formatDateToSupabaseFormat(date)
    expect(result).toBe('2024-12-06')
  })

  test('should format a date with single-digit month and day correctly', () => {
    const date = new Date(2024, 0, 5)
    const result = formatDateToSupabaseFormat(date)
    expect(result).toBe('2024-01-05')
  })

  test('should format a date at the start of the year correctly', () => {
    const date = new Date(2024, 0, 1)
    const result = formatDateToSupabaseFormat(date)
    expect(result).toBe('2024-01-01')
  })
})

describe('parseSupabaseDateStringToDate', () => {
  test('should correctly parse a valid date string', () => {
    const dateString = '2024-12-06'
    const result = parseSupabaseDateStringToDate(dateString)
    expect(result).toEqual(new Date(2024, 11, 6))
  })

  test('should throw an error for invalid date strings (missing parts)', () => {
    const invalidDateStrings = '2024-12'

    expect(() => parseSupabaseDateStringToDate(invalidDateStrings)).toThrow(
      'Invalid date string provided.'
    )
  })

  test('should handle leading zeros correctly', () => {
    const dateString = '2024-01-05'
    const result = parseSupabaseDateStringToDate(dateString)
    expect(result).toEqual(new Date(2024, 0, 5))
  })
})
