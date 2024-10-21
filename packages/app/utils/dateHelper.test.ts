import { describe, expect, it } from '@jest/globals'
import { adjustUTCDateForTimezone, CommentsTime } from './dateHelper'
describe('CommentsTime', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2021-08-01').getTime())
  })
  afterAll(() => {
    jest.useRealTimers()
  })
  it('time should be 0 sec ago', () => {
    expect(CommentsTime(new Date().toString())).toBe('0 sec ago')
  })
  it('time should be 4 day ago', () => {
    const dateObj = new Date()
    dateObj.setDate(dateObj.getDate() - 4)
    expect(CommentsTime(dateObj.toString())).toBe('4 day ago')
  })
  it('time should be 1 mon ago', () => {
    const dateObj = new Date()
    dateObj.setDate(dateObj.getDate() - 30)
    expect(CommentsTime(dateObj.toString())).toBe('1 mon ago')
  })
  it('time should be 1 year ago', () => {
    const dateObj = new Date()
    dateObj.setDate(dateObj.getDate() - 365)
    expect(CommentsTime(dateObj.toString())).toBe('1 year ago')
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
