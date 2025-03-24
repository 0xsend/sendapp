import {
  byteaToHexEthAddress,
  byteaToHexTxHash,
  decimalStrToBigInt,
  epochToDate,
} from 'app/utils/zod'
import { z } from 'zod'

/**
 * Schema for affiliate and their Send Earn affiliate vault. The `send_earn` field is the
 * the vault address that the affiliate receives fees from. To see the affiliate
 * fees, check the balance of the `send_earn_affiliate` address.
 */
export const AffiliateVaultSchema = z
  .object({
    affiliate: byteaToHexEthAddress,
    send_earn_affiliate: byteaToHexEthAddress,
    send_earn_affiliate_vault: z
      .object({
        send_earn: byteaToHexEthAddress,
        log_addr: byteaToHexEthAddress,
      })
      .nullable(),
  })
  .nullable()

export type AffiliateVault = z.infer<typeof AffiliateVaultSchema>

/**
 * Send Earn maintains an activity feed that includes deposits and withdrawals outside of the main activity feed.
 */
export const SendEarnActivitySchema = z.object({
  type: z.enum(['deposit', 'withdraw']),
  block_num: z.number(),
  block_time: epochToDate,
  log_addr: byteaToHexEthAddress,
  owner: byteaToHexEthAddress,
  sender: byteaToHexEthAddress,
  assets: decimalStrToBigInt,
  shares: decimalStrToBigInt,
  tx_hash: byteaToHexTxHash,
})
export const SendEarnActivitySchemaArray = z.array(SendEarnActivitySchema)
export type SendEarnActivity = z.infer<typeof SendEarnActivitySchema>
