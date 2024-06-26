import { z } from 'zod'
import { decimalStrToBigInt } from '../bigint'
import { byteaToHexEthAddress, byteaToHexTxHash } from '../bytea'

export const OnchainEventDataSchema = z.object({
  /**
   * The transaction hash that included this event
   */
  tx_hash: byteaToHexTxHash,
  /**
   * The contract address that emitted the event
   */
  log_addr: byteaToHexEthAddress,
  /**
   * The block number of the transaction
   */
  block_num: decimalStrToBigInt,
  /**
   * The transaction index of the transaction
   */
  tx_idx: decimalStrToBigInt,
  /**
   * The log index of the transaction
   */
  log_idx: decimalStrToBigInt,
})
