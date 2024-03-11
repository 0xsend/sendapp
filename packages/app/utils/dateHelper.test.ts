import { describe, expect, it } from '@jest/globals'
import { CommentsTime } from './dateHelper'
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
