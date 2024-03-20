import { describe, expect, it } from '@jest/globals'

import { formatPhoneNumber } from './formatPhoneNumber' // Adjust the import path

describe('formatPhone', () => {
  it('should handle US phone number', () => {
    expect(formatPhoneNumber('14194452233')).toBe('(419) 445-2233')
  })

  it('should handle other country numbers: UK', () => {
    expect(formatPhoneNumber('442079460000')).toBe('+44 20 7946 0000')
  })

  it('should handle other country numbers: China', () => {
    expect(formatPhoneNumber('8615555151447')).toBe('+86 155 5515 1447')
  })

  it('should handle other country numbers: Ukraine', () => {
    expect(formatPhoneNumber('380947100983')).toBe('+380 94 710 0983')
  })

  it('should handle other country numbers: Brazil', () => {
    expect(formatPhoneNumber('5511953259340')).toBe('+55 11 95325 9340')
  })

  it('should handle other country numbers: Australia', () => {
    expect(formatPhoneNumber('61489921018')).toBe('+61 489 921 018')
  })

  it('should handle other country numbers: Mexico', () => {
    expect(formatPhoneNumber('528124129087')).toBe('+52 81 2412 9087')
  })

  it('should handle undefined input', () => {
    expect(formatPhoneNumber(undefined)).toBe('')
  })
  it('should return input if < 11 numbers or country can not be determined', () => {
    expect(formatPhoneNumber('12345678')).toBe('12345678')
  })
})
