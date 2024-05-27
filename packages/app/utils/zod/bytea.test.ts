import { describe, expect, it } from '@jest/globals'
import { byteaEthAddress, byteaToHexEthAddress, byteaTxHash } from './bytea'
import { assert } from 'app/utils/assert'

describe('pgEthAddr', () => {
  it('should return a valid eth address', () => {
    expect(byteaEthAddress.parse('\\xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1')).toEqual(
      '\\xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1'
    )
  })
  it('should return an error for an invalid eth address', () => {
    const cases = [
      '\\xasdf',
      'zzzz',
      '\\xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1\\x',
      '0xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1',
    ]
    for (const input of cases) {
      const result = byteaEthAddress.safeParse(input)
      assert(result.success === false)
    }
  })
})

describe('pgToHexEthAddress', () => {
  it('should return a valid eth address', () => {
    expect(byteaToHexEthAddress.parse('\\xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1')).toEqual(
      '0xbf65EE06b43B9cA718216241f0b9F81b5ff30CC1'
    )
  })
  it('should return an error for an invalid eth address', () => {
    const cases = [
      '\\xasdf',
      'zzzz',
      '\\xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1\\x',
      '0xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1',
    ]
    for (const input of cases) {
      const result = byteaToHexEthAddress.safeParse(input)
      assert(result.success === false)
    }
  })
})

describe('pgTxHash', () => {
  it('should return a valid transaction hash', () => {
    expect(
      byteaTxHash.parse('\\x37c4281422413a3a78e765452c47abb5c3a95c102282bdd3632ced0b640d861c')
    ).toEqual('\\x37c4281422413a3a78e765452c47abb5c3a95c102282bdd3632ced0b640d861c')
  })
  it('should return an error for an invalid transaction hash', () => {
    const cases = [
      '\\xasdf',
      'zzzz',
      '\\x37c4281422413a3a78e765452c47abb5c3a95c102282bdd3632ced0b640d861c\\x',
      '0x37c4281422413a3a78e765452c47abb5c3a95c102282bdd3632ced0b640d861c',
    ]
    for (const input of cases) {
      const result = byteaTxHash.safeParse(input)
      assert(result.success === false)
    }
  })
})
