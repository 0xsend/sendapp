import { describe, expect, it } from '@jest/globals'
import { hex, address } from './evm'
import { assert } from 'app/utils/assert'

describe('hex', () => {
  it('should return a valid hex string', () => {
    expect(hex.parse('0x1234')).toEqual('0x1234')
    expect(hex.parse('0xabcd')).toEqual('0xabcd')
    expect(hex.parse('0xABCD')).toEqual('0xABCD')
    expect(hex.parse('0x'))
  })

  it('should return an error for invalid hex strings', () => {
    const cases = [
      '1234', // missing 0x prefix
      '0xghijk', // invalid hex characters
      'asdf', // not hex at all
      '0x123g', // invalid hex character
    ]
    for (const input of cases) {
      const result = hex.safeParse(input)
      assert(result.success === false)
    }
  })
})

describe('address', () => {
  it('should return a checksummed ethereum address', () => {
    expect(address.parse('0xeab49138ba2ea6dd776220fe26b7b8e446638956')).toEqual(
      '0xEab49138BA2Ea6dd776220fE26b7b8E446638956'
    )
    expect(address.parse('0x0000000000000000000000000000000000000000')).toEqual(
      '0x0000000000000000000000000000000000000000'
    )
  })

  it('should return an error for invalid ethereum addresses', () => {
    const cases = [
      '0x', // too short
      '0x1234', // too short
      '0xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1ff', // too long
      '0xbf65ee06b43b9ca718216241f0b9f81b5ff30cc', // too short
      'bf65ee06b43b9ca718216241f0b9f81b5ff30cc1', // missing 0x prefix
      '0xbf65ee06b43b9ca718216241f0b9f81b5ff30cg1', // invalid hex
    ]
    for (const input of cases) {
      const result = address.safeParse(input)
      assert(result.success === false)
    }
  })
})
