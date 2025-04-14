import { CoinSchema, usdcCoin } from 'app/data/coins'
import { z } from 'zod'
import { decimalStrToBigInt } from '../bigint'
import { byteaToHexEthAddress } from '../bytea'
import { BaseEventSchema } from './BaseEventSchema'
import { Events } from './events'
import { OnchainEventDataSchema } from './OnchainDataSchema'
import { temporalUserOpStatus } from './temporal'

/**
 * Base Schema for Send Earn event data
 * Consolidated with fields from the feature-specific schema
 */
const SendEarnBaseDataSchemaRaw = OnchainEventDataSchema.extend({
  /**
   * The owner of the Send Earn shares
   */
  owner: byteaToHexEthAddress,
  /**
   * The sender address (originator of the deposit or withdrawal)
   */
  sender: byteaToHexEthAddress,
  /**
   * The amount of assets
   */
  assets: decimalStrToBigInt,
  /**
   * The amount of shares
   */
  shares: decimalStrToBigInt,
})

export const SendEarnBaseDataSchema = SendEarnBaseDataSchemaRaw

/**
 * Schema for Send Earn Deposit events
 */
export const SendEarnDepositDataSchema = SendEarnBaseDataSchemaRaw.extend({})

export const SendEarnDepositEventSchema = BaseEventSchema.extend({
  event_name: z.literal(Events.SendEarnDeposit),
  data: SendEarnDepositDataSchema,
})

export type SendEarnDepositEvent = z.infer<typeof SendEarnDepositEventSchema>

/**
 * Schema for Send Earn Withdraw events
 */
export const SendEarnWithdrawDataSchema = SendEarnBaseDataSchemaRaw.extend({
  /**
   * The receiver address (destination of the withdrawal)
   */
  receiver: byteaToHexEthAddress,
})

export const SendEarnWithdrawEventSchema = BaseEventSchema.extend({
  event_name: z.literal(Events.SendEarnWithdraw),
  data: SendEarnWithdrawDataSchema,
})

export type SendEarnWithdrawEvent = z.infer<typeof SendEarnWithdrawEventSchema>

/**
 * Schema for Temporal Send Earn Deposit events (pending or failed state)
 */
export const TemporalSendEarnDepositDataSchema = z
  .object({
    workflow_id: z.string(),
    owner: byteaToHexEthAddress.optional(),
    assets: decimalStrToBigInt.optional(),
    vault: byteaToHexEthAddress.optional(),
    status: temporalUserOpStatus,
    error_message: z.string().nullable().optional(),
  })
  .extend({
    coin: CoinSchema.optional(),
  })
  .transform((t) => ({
    ...t,
    // Assume USDC if assets are present, otherwise null
    coin: t.assets && usdcCoin ? usdcCoin : null,
  }))

export const TemporalSendEarnDepositEventSchema = BaseEventSchema.extend({
  event_name: z.literal(Events.TemporalSendEarnDeposit),
  data: TemporalSendEarnDepositDataSchema,
})

export type TemporalSendEarnDepositEvent = z.infer<typeof TemporalSendEarnDepositEventSchema>

export type SendEarnEvent =
  | SendEarnDepositEvent
  | SendEarnWithdrawEvent
  | TemporalSendEarnDepositEvent
export const isSendEarnDepositEvent = (event: {
  event_name: string
}): event is SendEarnDepositEvent => event.event_name === Events.SendEarnDeposit

export const isSendEarnWithdrawEvent = (event: {
  event_name: string
}): event is SendEarnWithdrawEvent => event.event_name === Events.SendEarnWithdraw

export const isTemporalSendEarnDepositEvent = (event: {
  event_name: string
}): event is TemporalSendEarnDepositEvent => event.event_name === Events.TemporalSendEarnDeposit

export const isSendEarnEvent = (event: {
  event_name: string
}): event is SendEarnEvent =>
  isSendEarnDepositEvent(event) ||
  isSendEarnWithdrawEvent(event) ||
  isTemporalSendEarnDepositEvent(event)
