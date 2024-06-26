import { formatTimeDate } from './formatTimeDate'

describe('formatTimeDate', () => {
  it('should format the time and date correctly', () => {
    const result = formatTimeDate('2023-05-15T13:45:00Z')

    // Check that the result contains the expected parts
    expect(result).toEqual(expect.stringContaining(':'))
    expect(result).toEqual(expect.stringContaining('2023'))
  })

  it('should handle invalid date strings gracefully', () => {
    const input = 'invalid-date-string'
    const result = formatTimeDate(input)

    expect(result).toBe('Invalid date')
  })
})
