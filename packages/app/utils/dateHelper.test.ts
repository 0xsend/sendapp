import { describe, expect, it } from '@jest/globals'
import {
  adjustTimezoneForUTCDate,
  adjustUTCDateForTimezone,
  CommentsTime,
  formatDateToLongForm,
  formatDateToLongFormWithoutYear,
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

describe('adjustTimezoneForUTCDate', () => {
  it('should handle dates already in UTC', () => {
    const utcDate = new Date('2024-12-13T00:00:00Z')
    const adjustedDate = adjustTimezoneForUTCDate(utcDate)
    expect(adjustedDate.toISOString()).toBe('2024-12-13T00:00:00.000Z')
  })

  it('should correctly adjust a date for a positive timezone offset', () => {
    const localDate = new Date('2024-12-13T00:00:00+05:00')
    const adjustedDate = adjustTimezoneForUTCDate(localDate)
    expect(adjustedDate.toISOString()).toBe('2024-12-12T19:00:00.000Z')
  })

  it('should correctly adjust a date for a negative timezone offset', () => {
    const localDate = new Date('2024-12-13T00:00:00-05:00')
    const adjustedDate = adjustTimezoneForUTCDate(localDate)
    expect(adjustedDate.toISOString()).toBe('2024-12-13T05:00:00.000Z')
  })
})
