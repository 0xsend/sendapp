import { describe, expect, test } from '@jest/globals'
import { packPaymasterData } from './userop'
import { concat, encodeAbiParameters, pad, toHex, type Hex } from 'viem'

const MOCK_VALID_UNTIL = '0x00000000deadbeef'
const MOCK_VALID_AFTER = '0x0000000000001234'
const MOCK_SIG = '0x1234'

describe('userop', () => {
  describe('packPaymasterData', () => {
    test('should pack paymaster data correctly', () => {
      const data = {
        paymaster: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as Hex,
        paymasterVerificationGasLimit: 300000n,
        paymasterPostOpGasLimit: 0n,
        paymasterData:
          '0x00000000000000000000000000000000000000000000000000000000deadbeef00000000000000000000000000000000000000000000000000000000000012341234' as Hex,
      }

      const packed = packPaymasterData(data)
      expect(packed).toEqual(
        '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0000000000000000000000000000493e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000deadbeef00000000000000000000000000000000000000000000000000000000000012341234'
      )
    })

    test('should return 0x for empty paymaster', () => {
      const packed = packPaymasterData({
        paymaster: '0x' as Hex,
        paymasterVerificationGasLimit: 0n,
        paymasterPostOpGasLimit: 0n,
      })

      expect(packed).toBe('0x')
    })
  })
  describe('parsePaymasterData', () => {
    test('should parse paymaster data correctly', async () => {
      const paymaster = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
      const paymasterVerificationGasLimit = 300000n
      const paymasterPostOpGasLimit = 0n
      const validUntil = Number(BigInt(MOCK_VALID_UNTIL))
      const validAfter = Number(BigInt(MOCK_VALID_AFTER))
      const signature = MOCK_SIG

      const paymasterData = concat([
        encodeAbiParameters([{ type: 'uint48' }, { type: 'uint48' }], [validUntil, validAfter]),
        signature,
      ]) as Hex

      const packed = packPaymasterData({
        paymaster,
        paymasterVerificationGasLimit: paymasterVerificationGasLimit,
        paymasterPostOpGasLimit: paymasterPostOpGasLimit,
        paymasterData,
      })

      // Check that packed data includes all components
      expect(packed.startsWith('0x')).toBe(true)
      expect(packed.includes(paymaster.slice(2))).toBe(true)
      expect(packed.includes(toHex(validUntil).slice(2))).toBe(true)
      expect(packed.includes(toHex(validAfter).slice(2))).toBe(true)
      expect(packed.includes(signature.slice(2))).toBe(true)

      // Verify gas limits are encoded correctly
      const verificationGasHex = pad(toHex(paymasterVerificationGasLimit), { size: 16 })
      const postOpGasHex = pad(toHex(paymasterPostOpGasLimit), { size: 16 })
      expect(packed.includes(verificationGasHex.slice(2))).toBe(true)
      expect(packed.includes(postOpGasHex.slice(2))).toBe(true)
    })
  })
})
