import { describe, expect, it } from '@jest/globals'

import formatNumpadInput from './formatNumpadInput' // Adjust the import path

describe('formatNumpadInput', () => {
  it('should handle decimal point input', () => {
    expect(formatNumpadInput('123', '.')).toBe('123.')
  })

  it('should not add decimal point when its already decimal', () => {
    expect(formatNumpadInput('0.1', '.')).toBe('0.1')
  })

  it('should handle backspace', () => {
    expect(formatNumpadInput('123.45', '<')).toBe('123.4')
  })

  it('should return 0 if backspace on length-1 number', () => {
    expect(formatNumpadInput('7', '<')).toBe('0')
  })

  it('should handle number input', () => {
    expect(formatNumpadInput('123', '4')).toBe('1234')
  })

  it('should just return input when the value is 0', () => {
    expect(formatNumpadInput('0', '1')).toBe('1')
  })

  it('should return max value when the current value is greater than max value', () => {
    expect(formatNumpadInput('1.2', '6', 1.25)).toBe('1.25')
  })
})
