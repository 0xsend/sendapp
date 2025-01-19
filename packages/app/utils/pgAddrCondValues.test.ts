import { pgAddrCondValues } from './pgAddrCondValues'
describe('pgAddrCondValues', () => {
  it('should return a string of values to be used in a postgrest WHERE IN clause', () => {
    const values = ['0x1234', '0x5678'] as `0x${string}`[]
    expect(pgAddrCondValues(values)).toBe('0x1234,0x5678')
  })
})
