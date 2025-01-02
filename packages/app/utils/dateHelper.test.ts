import { describe, expect, it } from '@jest/globals'
import {
  adjustDatePickerDateToTimezone,
  adjustUTCDateForTimezone,
  CommentsTime,
  isEqualCalendarDate,
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

describe('adjustDatePickerDateToTimezone', () => {
  it('should handle dates already in UTC', () => {
    const utcDate = new Date('2024-12-13T00:00:00Z')
    const adjustedDate = adjustDatePickerDateToTimezone(utcDate)
    expect(adjustedDate.toISOString()).toBe('2024-12-13T00:00:00.000Z')
  })

  it('should correctly adjust a date for a positive timezone offset', () => {
    const localDate = new Date('2024-12-13T00:00:00+05:00')
    const adjustedDate = adjustDatePickerDateToTimezone(localDate)
    expect(adjustedDate.toISOString()).toBe('2024-12-12T19:00:00.000Z')
  })

  it('should correctly adjust a date for a negative timezone offset', () => {
    const localDate = new Date('2024-12-13T00:00:00-05:00')
    const adjustedDate = adjustDatePickerDateToTimezone(localDate)
    expect(adjustedDate.toISOString()).toBe('2024-12-13T05:00:00.000Z')
  })
})

describe('isSameDay', () => {
  it('should return true if the dates are the same', () => {
    const date1 = new Date('2024-12-13T00:00:00.000Z')
    const date2 = new Date('2024-12-13T00:00:00.000Z')
    expect(isEqualCalendarDate(date1, date2)).toBe(true)
  })

  it('should return false if the dates are not the same', () => {
    const date1 = new Date('2024-12-13T00:00:00.000Z')
    const date2 = new Date('2024-12-14T00:00:00.000Z')
    expect(isEqualCalendarDate(date1, date2)).toBe(false)
  })
  it('should return false if the dates are in different years', () => {
    const date1 = new Date('2024-12-13T00:00:00.000Z')
    const date2 = new Date('2025-12-13T00:00:00.000Z')
    expect(isEqualCalendarDate(date1, date2)).toBe(false)
  })
  it('should return false if the dates are in different months', () => {
    const date1 = new Date('2024-12-13T00:00:00.000Z')
    const date2 = new Date('2024-11-13T00:00:00.000Z')
    expect(isEqualCalendarDate(date1, date2)).toBe(false)
  })
})
