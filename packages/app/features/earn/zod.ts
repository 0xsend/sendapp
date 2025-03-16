import { byteaToHexEthAddress } from 'app/utils/zod'
import { z } from 'zod'

/**
 * Schema for affiliate and their Send Earn affiliate vault. The `send_earn` field is the
 * the vault address that the affiliate receives fees from. To see the affiliate
 * fees, check the balance of the `send_earn_affiliate` address.
 */
export const AffiliateVaultSchema = z
  .object({
    affiliate: byteaToHexEthAddress,
    send_earn_affiliate_vault: z
      .object({
        send_earn: byteaToHexEthAddress,
      })
      .nullable(),
  })
  .nullable()
