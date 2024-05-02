import { describe, it } from '@jest/globals'
import { throwIf } from './throwIf'

describe('throwIf', () => {
  it('should throw if the condition is true', () => {
    expect(() => throwIf(true)).toThrow()
  })

  it('should not throw if the condition is false', () => {
    expect(() => throwIf(false)).not.toThrow()
  })

  it('should throw if the condition is an error', () => {
    expect(() => throwIf(new Error('test'))).toThrow('test')
  })

  it('should throw if the condition is a string', () => {
    expect(() => throwIf('test')).toThrow('test')
  })

  it('should not throw if the condition is falsy', () => {
    expect(() => throwIf(null)).not.toThrow('null')
    expect(() => throwIf(0)).not.toThrow('0')
    expect(() => throwIf('')).not.toThrow('')
    expect(() => throwIf(Number.NaN)).not.toThrow('NaN')
    expect(() => throwIf(undefined)).not.toThrow('undefined')
  })
  it('should throw if the condition is an object', () => {
    expect(() => throwIf({})).toThrow('[object Object]')
  })
})
